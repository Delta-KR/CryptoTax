# Logic & bug audit — 2026-05-23

Scope: parsers, tax engine, FX rates, storage, server actions, API routes, RLS,
state management, timezone. Source-only audit (no app run).

## P0 (real bug — wrong output / data loss / crash / security)

### P0-1 — RLS allows users to self-promote to premium
- `supabase/migrations/20260518000000_create_profiles.sql:22-26`
- The `profiles_update_own` policy uses `USING ((select auth.uid()) = id) WITH
  CHECK ((select auth.uid()) = id)` but does **not** restrict which columns may
  change. Any authenticated user can `update profiles set plan='premium',
  premium_until='2099-12-31' where id=auth.uid()` via the supabase-js client and
  immediately unlock all premium features (PDF report, unmasked tax calc).
- The migration comment at line 15 / 50 claims "plan/premium_until은
  service_role webhook에서만 변경 가능하도록 별도 가드" — that guard does not
  exist in code. `upgrade-plan.ts` blocks the server action but RLS itself is
  open.
- Repro: `supabase.from('profiles').update({ plan: 'premium' }).eq('id',
  user.id)` from browser console after logging in.
- Fix: replace the UPDATE policy with a column-restricted one, e.g.
  ```sql
  create policy profiles_update_own on public.profiles for update
    using ((select auth.uid()) = id)
    with check (
      (select auth.uid()) = id
      and plan = (select p.plan from public.profiles p where p.id = id)
      and premium_until is not distinct from (select p.premium_until from public.profiles p where p.id = id)
    );
  ```
  or split: allow self-updates only on `email` (etc.) via a trigger/function
  that rejects plan/premium_until changes unless `current_setting('role') =
  'service_role'`.

### P0-2 — Naver users locked out after first login
- `app/api/auth/naver/callback/route.ts:80-100`
- The C2 takeover guard checks
  `identities.some(i => i.provider === 'naver')`. But Naver login goes through
  Supabase `admin.generateLink({ type: 'magiclink' })`, which creates an
  **`email`** identity, never a `naver` identity. `app_metadata.providers =
  ['naver']` is set, but `identities[].provider` is `'email'`.
- After the first successful Naver signup, every subsequent login fails with
  `?error=already_registered_other_provider`. Users are permanently locked out.
- Repro: sign up via Naver → log out → click Naver login → redirected to
  `/login?error=already_registered_other_provider`.
- Fix: also accept `lookup.user.app_metadata?.providers?.includes('naver')` or
  `lookup.user.app_metadata?.provider === 'naver'` in the guard:
  ```ts
  const naverLinked =
    identities.some(i => i.provider === 'naver') ||
    lookup.user.app_metadata?.providers?.includes('naver') ||
    lookup.user.app_metadata?.provider === 'naver';
  ```

### P0-3 — RLS regression: `user_deemed_cost_overrides` UPDATE lost WITH CHECK
- `supabase/migrations/20260523030000_optimize_rls_initplan.sql:15-30`
- The "P0 hotfix" (20260523010000) added `WITH CHECK (auth.uid() = user_id)` to
  fix C1 (user could update their row's `user_id` to another user's id, moving
  the override). The later `optimize_rls_initplan` migration drops and
  recreates the same policy **without** `WITH CHECK`, silently reverting the
  fix.
- `user_data_update_own` (line 69-71) and `user_imputed_expense_coins`
  (untouched, still has WITH CHECK from p0_hotfix) are partially affected too —
  `user_data_update_own` has no WITH CHECK either, so a user could `update
  user_data set user_id = '<victim>'` to corrupt another user's snapshot if
  they could first match `user_id = self`.
- Repro: with two test users A and B, log in as A; via supabase-js
  `from('user_deemed_cost_overrides').update({user_id: B}).eq('user_id', A)`.
  Migration `20260523030000` ran after the hotfix so the WITH CHECK is gone.
- Fix: add `with check ((select auth.uid()) = user_id)` to the recreated UPDATE
  policies in `20260523030000_optimize_rls_initplan.sql`, or land a new
  migration that re-adds them. Same for `user_data_update_own`.

### P0-4 — Server `/api/report` trusts client-supplied transaction amounts
- `app/api/report/route.ts:152-173`
- The "C5 server-recalc" mitigation runs `calculateTax(transactions, ...)` on
  the server to prevent the client from forging `result.taxAmountKRW = 0`. But
  the `transactions` it feeds in are `body.transactions.map(unifiedFromWire)`
  — the client-supplied unified transactions, with
  `pricePerUnitKRW` / `totalKRW` / `feeKRW` straight from the request body.
  Schema validation only bounds the numbers (`±1e15`).
- A client can submit a SELL with `totalKRW: 0` and the server will
  recompute `pnlKRW = 0 − cost − fee`, generating a PDF report that shows zero
  tax even though the user actually made millions.
- Repro: in the network panel, edit the JSON request to `/api/report`, set any
  SELL's `totalKRW` to `0`, re-send. Server-issued PDF returns ₩0 납부세액.
- Fix: persist the original parsed transactions server-side (or store hash of
  parsed CSV/PDF) and re-derive `totalKRW/pricePerUnitKRW` from the immutable
  source. Or stop generating audit-trail-grade PDFs from client-supplied data
  and document the report as a "self-declared" worksheet only — currently the
  footer says exactly that but the marketing copy implies authoritative.
- This is the known limitation referenced in [reference_security_blindspots]
  but the schema accepts and the engine processes whatever the client sends
  without cross-check.

### P0-5 — Naver cron timeout default 5s vs. backfill takes ~60s (mitigated, retained P1 note)
- Not actually P0 — see migration `20260522010000_increase_cron_timeout.sql`
  and `20260522030000_cron_shared_secret.sql:58` which sets
  `timeout_milliseconds := 120000`. Verified clean.

## P1 (functional bug — wrong UX, partial failure, security misclaim)

### P1-1 — `/report` page dropdown changes are ignored on PDF download
- `app/(app)/report/page.tsx:118-135 + 54-93`
- The page presents `year` (2027/2026) and `method` (총평균법/FIFO/MA) selects.
  Both update local `useState` but `handleDownload` ignores them: it sends
  `year: session.year, method: session.method`. The "참고용" dropdown choices
  never reach the server.
- Worse, the `method` dropdown lists FIFO/MA but the API explicitly rejects
  anything except `totalAverage` (route.ts:142-150) with a 400. A user who
  re-uploaded with FIFO via tax/settings (which goes via calculate.ts and
  stores method=fifo) and then clicks "PDF 다운로드" gets a 400 with
  Korean-only error.
- Fix: either remove the selects from `/report` (since session decides), or
  trigger a recalculation when the user changes them before download.

### P1-2 — Time-zone-sensitive `getFullYear()` filters in client UI
- `app/(app)/dashboard/page.tsx:110`,
  `lib/mock/transactions.ts:73`,
  `lib/report/tax-report.tsx:185-188`,
  `app/(app)/tax/page.tsx:299-302`.
- These call `new Date(iso).getFullYear()` / `getMonth()` / `getDate()` —
  **local** timezone, not KST. The engine uses `kstYear` consistently, but
  these UI paths and the server-rendered PDF use local time. On Vercel
  serverless (UTC), a transaction at `2027-01-01T01:00:00+09:00` (= `2026-12-31
  16:00 UTC`) shows up as **2026** in the PDF and dashboard filter, while the
  engine counts it as **2027**. Year-boundary KST trades silently misreport.
- Repro: add a trade with `date: '2027-01-01T01:00:00+09:00'` to allUnified;
  open `/dashboard` (with KST timezone OK; with browser set to UTC, the
  transaction is missing from "최근 거래" of 2027); generate PDF on Vercel —
  the "매도 명세" row shows date 2026-12-31 even though it's in the 2027 tax
  year.
- Fix: replace with KST shift everywhere a transaction date is displayed or
  filtered. `lib/engine/exchange-rate.ts:toKSTDateStr` already does this
  correctly; export & reuse, or add `kstDateStr` and `kstFullYear` helpers.

### P1-3 — `extractPreDeemedCoins` boundary off by 9h
- `app/(app)/tax/deemed-cost/page.tsx:64-69`
- Uses `tx.date.slice(0, 10) < '2027-01-01'`. `tx.date` is `toISOString()`
  (UTC). A BUY at `2027-01-01 06:00 KST` = `2026-12-31T21:00:00Z` becomes
  `2026-12-31` after `slice(0,10)` → flagged as pre-deemed even though the
  engine (using `isPreDeemedDate` against `2027-01-01T00:00:00+09:00`) treats
  it as post-deemed.
- Functional impact: the manual-input page surfaces extra coins. User may try
  to enter a deemed cost that the engine then silently ignores. Mostly
  cosmetic, but confusing.
- Fix: compute KST date string before comparison:
  ```ts
  const kstStr = new Date(new Date(tx.date).getTime() + 9*3600*1000)
    .toISOString().slice(0, 10);
  if (kstStr < '2027-01-01') set.add(tx.coin);
  ```

### P1-4 — PDF "이동평균 (혼합 매수)" row shown for `totalAverage` with ₩0 단가
- `lib/report/tax-report.tsx:576-596`
- The branch `method !== 'fifo'` covers both `avg` and `totalAverage`. For
  `totalAverage`, the engine sets `consumedLots: []` (total-average.ts:214),
  so `g.consumedLots[0]?.pricePerUnitKRW` is `undefined`, `formatKRW(undefined)`
  returns `₩0`. The PDF prints "이동평균 (혼합 매수)" + "평균 단가 ₩0" — both
  the label and the value are wrong.
- Fix: split the branch — for `totalAverage`, derive 평균 단가 from
  `g.costBasisKRW / g.sellAmount` and label as "총평균법 (연 평균 단가)". Or
  guard `consumedLots.length === 0` and emit a brief row using `costBasisKRW`.

### P1-5 — Upbit parser drops second-level precision → dedupe false positives
- `lib/parsers/upbit.parser.ts:38-47`
- The `parseDateTime` uses `HH:mm:00` (seconds hard-coded to 0) because Upbit
  PDF only shows minute precision. Two genuine trades 30 seconds apart with
  the same coin/amount/price/fee (common for bot or 매수가 분 단위 반복) get
  the same `date.getTime()`. The dedupe key
  (`lib/engine/dedupe.ts:9-22`) then merges them into one, halving the
  reported cost basis and proceeds. Tests in `dedupe.test.ts:66-73` actually
  cover the *opposite* case (1-second difference avoids dedup) — but since
  Upbit feeds always have :00, that test is moot.
- Realistic risk: low-frequency users probably won't have minute-level
  duplicates. High-frequency Upbit users (DCA bots, market makers) will lose
  trades.
- Fix: either (a) include a Upbit `정산금액`/native row index in the dedupe
  key, or (b) detect duplicate-key collisions and warn instead of silently
  dropping.

### P1-6 — Rate-limit env missing on dev/preview = blanket 500
- `lib/rate-limit.ts:37-46` and consumers (`calculate.ts:82`,
  `app/api/report/route.ts:73`)
- `getReportRateLimit()` / `getCalculateRateLimit()` **throw synchronously**
  when `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is absent. The
  throw is caught by the outer try/catch in each consumer but the user sees
  the generic "PDF 생성 중 오류" / "파일 처리 중 알 수 없는 오류" with no hint
  about Upstash env.
- The intended fail-closed pattern in `checkRateLimit` (line 87-95) only kicks
  in if `rateLimit.limit(...)` itself rejects — but reaching that call requires
  `getReportRateLimit()` to succeed first.
- Fix: catch the throw inside `getReportRateLimit()` / `getCalculateRateLimit()`
  and return a stub (or a "skip rate limit" sentinel). Document the dev-time
  Upstash requirement.

### P1-7 — Free-tier mask leaks pricePerUnitKRW & holdings via `holdingsAfter`
- `lib/engine/wire.ts:60-75`
- `maskForFree` clears `realizedGains`, `taxableIncomeKRW`, `taxAmountKRW`,
  `incomeTaxKRW`, `localTaxKRW`, and per-coin `realizedPnLKRW` — but **not**
  `holdingsAfter`. Holdings include lot-level `pricePerUnitKRW` and
  `totalCostKRW`. A free user can derive their realized PnL approximation by
  comparing pre/post snapshots, defeating the masking intent. Also `summary`
  retains `totalBuyKRW` and `totalSellKRW` which together with `netPnLKRW`
  (still present per coin via mock/tax → `r.netPnLKRW`) leaks the answer.
- Actually, `netPnLKRW` at the top level is also not masked. Engine sets it,
  wire passes it through. A free user can read `result.netPnLKRW` and derive
  taxable income via the same formula.
- Fix: also zero out `netPnLKRW`, `totalGainKRW`, `totalLossKRW`,
  `summary[].totalBuyKRW/totalSellKRW`, and `holdingsAfter` for free users —
  or move all paywalled fields server-side only and never ship them in
  `result`.

### P1-8 — `/tax` "재계산" button is a no-op toast
- `app/(app)/tax/page.tsx:575-580`
- The "재계산" button just calls `toast.show('세금 계산이 재실행되었습니다.',
  'success')`. No actual recalculation runs. The async useEffect at line
  535-556 does run a hidden recalc on first paint if `result.masked &&
  user.plan === 'premium'` (paid user with stale free-tier cache), but the
  button itself does nothing.
- Fix: wire the button to the same effect (drop the `recalcTriggered.current`
  guard) or remove the button.

### P1-9 — Static FX fallback throws for non-USDT/BTC fee currencies
- `lib/engine/rates-data.ts:14-35` + `lib/engine/rate-provider.ts:144-159`
- `DAILY_RATES_FALLBACK` only contains USDT/KRW and BTC/KRW pairs. If a Binance
  trade has `feeCurrency: 'BNB'` (default fee discount) and the DB is missing
  the BNB rate for that day, `staticFallback.getRateWithMeta` throws
  "환율 데이터 누락", which `getRateWithMeta` re-throws. The error propagates
  out of `calculateTaxFromFiles` and the user sees the raw `환율 데이터 누락:
  BNB→KRW, 기준일 2027-...` — no friendly explanation.
- Fix: extend the fallback with BNB/ETH/SOL quarterly rates (cheap, deterministic),
  or convert the throw into a `ParseError` with clear remediation
  ("BNB 일별 시세 미적재 — 시세 갱신 후 재시도").

### P1-10 — Cron secret stored in plaintext in `cron.job`
- `supabase/migrations/20260522030000_cron_shared_secret.sql:42-61`
- `format($cmd$ ... %L $cmd$, v_secret)` interpolates the vault secret into the
  cron job's body. The cron job (table `cron.job`) keeps the rendered SQL
  text. Any postgres user with read access to `cron.job` (e.g., the dashboard
  SQL editor connected as `postgres`) can extract the secret in plaintext.
- The fetch-daily-rates edge function uses the secret only to gate access,
  not as a high-value key, so impact is medium. But the vault was set up
  precisely to *avoid* plaintext storage; this defeats its purpose.
- Fix: load the secret at call time via a SECURITY DEFINER function
  (`select my_get_secret('fetch_rates_shared_secret')`) and reference the
  function call in the cron body, so the secret never appears in `cron.job`.

## P2 (minor / hypothetical)

### P2-1 — `setSessionUser` is module-level mutable; multi-tab races possible
- `lib/storage/session.ts:24-32`
- Two tabs in the same browser share the module instance only within a single
  page load. The `currentUserId` variable lives in JS memory per-tab —
  multi-tab doesn't share it. But if a tab opens before `useCurrentUser`
  resolves, `loadSession()` reads the anon key. `AppShell` mitigates by
  rendering null until user loads, so direct user impact is small.
- Fix (defense-in-depth): write `currentUserId` to `sessionStorage` so
  reload preserves it; or pass `userId` explicitly to load/save and remove
  the module-level state.

### P2-2 — `localStorage.QuotaExceededError` silently swallowed
- `lib/storage/session.ts:117-127` and `clearAllSessions` (line 146-159)
- Large transaction sets (10k+) may exceed the 5MB per-origin quota.
  `saveSession` swallows the error with empty catch — the user sees no
  warning and assumes their data is saved. The server snapshot succeeds
  separately, so data is recoverable, but the "load on next visit" returns
  null.
- Fix: detect QuotaExceeded and surface a toast / direct user to JSON export.

### P2-3 — JSON import path bypasses dedupe across sessions
- `lib/storage/session.ts:219-242`
- `importFromJSON` calls `saveSession(data)` directly, overwriting the
  current session. There's no merge step. If user has data on device A and
  exports to JSON, then on device B has additional uploads and imports the
  JSON from A — they replace B's data entirely. The error message implies a
  "디바이스 간 이동" but in reality it's overwrite, not merge.
- Fix: either rename UI to "백업 복원" (overwrite semantics, current behavior),
  or implement merge via dedupe.

### P2-4 — `tax-calculator.calculateTaxTotalAverage` skips `summaryByExchange`
  recompute for orphan/imputed adjustments
- `lib/engine/total-average.ts:283-288`
- `buildSummary` and `buildSummaryByExchange` iterate the raw `transactions`
  (with year filter). For imputed coins, the per-coin `realizedPnL` comes
  from the imputed branch (50%). For TA-orphan sells, `pnlKRW = -sellFee`
  (or 0 with the +0 normalization). These flow into the `RealizedGain[]`
  passed to `buildSummary`, so `summary[coin].realizedPnLKRW` is correct.
  Verified by re-reading.
- Verified clean.

### P2-5 — Free-tier mask still shows `summary[].totalFeeKRW`, transactionCount
- See P1-7. The volume/count metrics aren't masked. Probably intentional
  ("see how much you traded") — confirm with product before changing.

### P2-6 — Year-Settings dropdown shows 2026 but engine forces 2027+
- `app/(app)/tax/page.tsx:572-573`, `lib/mock/tax.ts:122-123`
- Selecting "2026년" returns `EMPTY_RESULT` (since `session.year` is
  whatever `currentTargetYear()` set = 2027). UI shows empty result. Not a
  bug but unintuitive.

### P2-7 — `applyDeemedCost` warning string is per-tx (not deduplicated)
- `lib/engine/total-average.ts:104` pushes one warning per pre-deemed BUY of
  the missing coin. A user with 50 BUYs of an exotic pre-2027 coin gets
  50 identical warnings in `result.warnings` (capped at 50 by report
  schema; potentially truncated).
- `tax-calculator.ts:50` has the same pattern in the FIFO/MA path.
- Fix: dedupe warnings before returning.

### P2-8 — `coin-coin SWAP` quote currency may not exist in deemed cost map
- `lib/engine/normalizer.ts:76-103` (BUY-side swap split) creates a synthetic
  SELL of `quoteCurrency` (e.g., BTC) with `originalCurrency: tx.quoteCurrency`.
  If `quoteCurrency` is 'BTC' and the user has no prior BTC buys (e.g., the
  BTC was airdropped externally), the synthetic SELL is orphan. Tests
  cover this scenario implicitly via E2E Scenario C. Engine handles via
  orphan code path. OK.
- Verified clean.

### P2-9 — `previousParsed` schema rejects `type: 'SWAP'` but
  `unifiedTransactionSchema` accepts it
- `lib/validation/calculate.ts:73` only allows `BUY|SELL` (matches
  `ParsedTransaction.type` which never has SWAP — parsers don't emit it
  directly).
- `lib/validation/report.ts:134` allows `BUY|SELL|SWAP` for `UnifiedTransactionWire`.
  The engine never emits SWAP (normalize splits SWAPs into BUY/SELL), but if
  a malicious or tampered session has a SWAP-typed unified tx and posts to
  `/api/report`, `calculateTax` silently ignores it (no branch handles SWAP).
  Not a bug; harmless.

### P2-10 — `lib/engine/total-average.ts` orphan dedup uses sell.totalKRW for
  costBasisKRW
- line 186: `costBasisKRW: sell.totalKRW`. So `pnl = sellTotal - sellTotal -
  fee = -fee`, then `roundKRW(-fee) + 0`. That produces `pnl = -feeKRW`. Test
  `total-average.test.ts:282-285` expects `pnlKRW = 0` for orphan. Let me
  re-check: fee in that test = 0 (default), so -0 + 0 = 0. But for a real
  orphan SELL with non-zero `feeKRW`, pnl will be negative (loss equal to
  fee). That's the intended treatment per the comment "매도 수수료만 손실
  처리" — but the docstring on the function says "손익 0 + 매도 수수료만
  손실 처리" which is contradictory (손익=0 vs 손익=-fee). Marketing the
  number as 0 in warnings while emitting a -fee pnl is mildly inconsistent.
- Verified consistent: warnings say 손익 0 but actual pnl is -fee. UI
  shows the actual pnl, so user sees the discrepancy. Minor doc fix.

## Verified clean

- `kstYear` and `isPreDeemedDate` use KST shift via `getUTCFullYear()` after
  ms offset — correct boundary handling at `2027-01-01T00:00 KST`. Tested in
  `deemed-cost.test.ts:21-32`, `tax-calculator.test.ts:21-29`.
- `dedupeParsedTransactions` natural key includes
  `date.getTime/type/coin/amount/pricePerUnit/total/fee/quote/feeCurrency/isSwap`
  — robust to id randomization across re-uploads (`dedupe.test.ts:30-37`).
  Caveat in P1-5 about minute-precision Upbit data.
- `calculateTax` TA path correctly carries forward year-end balance into
  next year's avgPrice computation (`total-average.test.ts:94-143`).
- Deemed-cost MAX(actual, snapshot) logic verified
  (`deemed-cost.test.ts:38-60`).
- Imputed-expense 50% flows through both TA and FIFO paths
  (`imputed-expense.test.ts`).
- C5 server-recalc correctly invokes `calculateTax` and ignores client
  `body.result` for tax math — but trusts the `transactions` themselves
  (see P0-4).
- `requirePremium` correctly composes `plan === 'premium'` AND `premium_until
  > now()` — but the RLS gap (P0-1) makes this bypassable client-side.
- Upbit signature check `looksLikeUpbitTransactionPdf` rejects ToS PDFs and
  receipts (`parsers.test.ts:178-216`).
- Account deletion uses `getUser()` server-side, never trusts client args
  (`account.test.ts:241-278`).
- Rate-limit fail-closed when redis throws (`lib/rate-limit.ts:87-95`).
- Naver OAuth state CSRF check (callback line 25-28) — correct.
- safeNext rejects protocol-relative and `/\` prefixed paths
  (`lib/auth/safe-next.ts:8`).
- `holdingsAfter` masking absent from `maskForFree` is the only paywall
  bypass route worth checking; see P1-7.
- Binance Spot parser correctly distinguishes Spot vs Futures (Realized
  Profit marker) and Spot Trade History vs Order History (OrderNo + Status
  header). `parsers.test.ts:75-79, 267-294`.
- Static fallback throws clearly when no rate available, no silent
  default-to-1.0 (`exchange-rate.ts:91-94`).
- FX preload uses both DB cache and 7-day backward search; metadata
  (sourceDate, source, sourceName) survives normalize → wire.
