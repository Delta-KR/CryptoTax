# Code quality audit — 2026-05-23

Worktree: `/Users/delta/Desktop/kontaxt/.claude/worktrees/distracted-booth-4027ee`
160 TS/TSX files (excluding tests/node_modules). 22,661 LOC.

Headline: type safety is excellent (zero `any`, zero `as any`, zero `@ts-ignore`),
zero TODO/FIXME, no production `console.log`. Real issues are concentrated in
(a) dead code in `lib/mock/*`, (b) two unused UI components / one unused page
placeholder, (c) one monster page file (`tax/page.tsx` 1039 LOC), (d) README
documenting only the marketing landing — fully stale vs the actual app.

---

## P0 (correctness — breaks build/types or actual bug)

None found. `tsc --noEmit` is presumed clean (strict mode on,
`isolatedModules: true`, no `@ts-ignore`/`@ts-expect-error` anywhere).

---

## P1 (real maintainability hit)

### Dead exports in mock layer

- **`lib/mock/transactions.ts:99` — `addBatch(_exchange, _count)`**
  No-op function (returns `[]`). Zero callers outside the file. Was a fake-data
  stub before real upload flow landed.
  - Fix: delete `addBatch` and remove from re-exports.

- **`lib/mock/transactions.ts:95` — `clearExtra()`**
  Trivial alias for `clearSession()`. Zero callers outside the file.
  - Fix: delete; callers (if any added later) should use `clearSession` directly.

- **`lib/mock/billing.ts:74,67` — `subscribe(plan)` / `getCurrentPlan()`**
  Zero callers anywhere. Plan state now flows through Supabase `profiles` table
  + `useCurrentUser()`. The localStorage `PLAN_KEY`/`HISTORY_KEY` cache they
  write to is also unread.
  - Fix: delete `subscribe`, `getCurrentPlan`, `addPayment`, the unused
    `PLAN_KEY`/`HISTORY_KEY` constants, and `defaultHistory`. Keep
    `getPaymentHistory`/`getTaxProRequest`/`submitTaxProRequest` (still called
    by `billing/history` and `billing/tax-pro` pages).

- **`app/actions/upgrade-plan.ts` — entire file**
  Both exported server actions (`upgradePlan`, `downgradePlan`) are stubs that
  return `{ ok: false, error: '결제 시스템 준비 중' }`, and neither is called
  anywhere in the app. Comment at top says "결제 시스템 통합 전까지 차단".
  - Fix: delete the file (re-create when Toss webhook integration lands); or
    add an `app/billing/checkout/page.tsx` call site if the intent was to keep
    the stub wired but disabled.

### Dead UI components

- **`components/Placeholder.tsx` — `Placeholder` export**
  Zero importers. Banner said "Stub page placeholder used until each phase
  builds out the real page" — that phase has passed.
  - Fix: delete the file.

- **`components/ui/Skeleton.tsx` — `Skeleton` export**
  Zero importers.
  - Fix: delete.

- **`components/ui/Badge.tsx` — `Badge` export**
  Zero importers. The `Badge` names found in `components/sections/hero.tsx`
  and `cta.tsx` are file-private definitions, not this one.
  - Fix: delete.

- **`components/ui/Chart/LineChart.tsx` — 280 LOC, `LineChart` / `LinePoint` /
  `LineSeries` exports**
  Zero importers. Header comment "v2 #2: 자체 SVG multi-line chart" suggests
  it was speculatively built for a chart on a dashboard page that ended up
  using `BarChart` instead.
  - Fix: delete the file (and drop the unused `components/ui/Chart/`
    directory if `BarChart.tsx` is the only sibling — verify before removing).

### Dead engine surface

- **`lib/engine/tax-engine.ts:17` — `TaxEngine.getLotsByCoin(coin)`**
  Interface method declared and implemented by both `FIFOEngine` and
  `MAEngine`, but called only inside `__tests__/`.
  - Fix: remove from the interface and both implementations, or document why
    test-only methods belong on the prod interface.

### Duplicate code

- **Three `formatKrw`/`formatKRW` implementations**
  - `lib/mock/tax.ts:218` (exported) — abbreviates as `억`/`만`
  - `app/(marketing)/sample/page.tsx:34` — abbreviates only `만`
  - `lib/report/tax-report.tsx:178` — no abbreviation, used inside PDF

  Three different formatters with three different output rules is fine if
  intentional (PDF needs literal amounts; landing page needs short form), but
  the marketing-sample copy could either share the `lib/mock/tax.ts` version or
  the comment should call out why it diverges.
  - Fix: import `formatKrw` from `lib/mock/tax.ts` into
    `app/(marketing)/sample/page.tsx` (or, if the abbreviation rules really
    must differ, rename PDF's `formatKRW` to `formatKrwFull` and add a one-line
    comment in each location).

- **`app/(app)/dashboard/page.tsx:26` — local `PageHeader` redefinition**
  All 13 other app pages import `@/components/app-chrome/PageHeader`. Only the
  dashboard inlines its own copy with slightly different markup (no
  `flex-shrink-0` wrapper on right, no responsive `sm:flex-row` switch).
  - Fix: import the shared `PageHeader`; if the desktop-only layout matters,
    add a `compact` prop instead of a fork.

- **`lib/auth/server.ts:30 vs :68` — `getEffectivePlan` and `requirePremium`
  both fetch user + profiles**
  Both call `supabase.auth.getUser()` then
  `from('profiles').select('plan, premium_until').eq('id', user.id)`. The
  callers in `app/api/report/route.ts:93–108` and `app/actions/calculate.ts:200`
  amplify this: `requirePremium` then `auth.getUser()` again for the user
  object.
  - Fix: extract a private `getUserAndProfile()` helper and have both wrappers
    consume it. In `route.ts:93–108`, reuse `guard.userId` instead of
    re-fetching `user` (or add `user: User` to `PremiumGuardOk`).

### Documentation drift

- **`README.md` (298 LOC) — describes only the marketing landing page**
  Sections cover the design tokens, hero/problem/pricing JSX, and "Phase 1
  marketing landing" — zero coverage of `/app/(app)/*` (dashboard, tax, report,
  transactions, billing, settings), `/app/(auth)/*` (login/signup), Supabase
  schema, Server Actions, the parser registry, or the rate-limit setup. Anyone
  reading README today would not learn that this is a full-stack SaaS.
  - Fix: either reorganize the README into "Product overview / Tech stack /
    Local dev / Domain glossary" and move the design-handoff content into
    `DESIGN.md` (which already exists at 270 LOC), or split into `README.md`
    (app) + `docs/design-handoff.md`.

- **`docs/audit/premium-audit-2026-05-22.md`** is current but should sit next
  to the new `code-quality-2026-05-23.md`, `perf-2026-05-23.md`,
  `security-2026-05-23.md`, `ux-2026-05-23.md` — no `INDEX.md` exists so the
  set is harder to navigate.
  - Fix: add a 10-line `docs/audit/README.md` linking each report with a
    one-line summary.

### Mis-located code

- **`lib/storage/session.ts` ↔ `app/actions/user-data.ts` cyclic import**
  - `lib/storage/session.ts:10` imports `saveSnapshot` from `app/actions/user-data`
  - `app/actions/user-data.ts:20` imports `sessionSchema`, `SessionData` from
    `lib/storage/session`

  Next.js handles `'use server'` modules via RPC stubs so this won't crash at
  runtime, but the cycle makes it hard to refactor either file in isolation
  and the type re-import is also dragging Zod into the client bundle through
  the server-action stub graph.
  - Fix: extract `sessionSchema` + `SessionData` into a new
    `lib/storage/session-schema.ts` with no runtime deps; have both
    `session.ts` and `user-data.ts` import from there.

### Test gaps

- **`app/actions/calculate.ts:76` — `calculateTaxFromFiles` has no test**
  This is the largest server action (281 LOC: file validation, rate-limit
  identifier resolution, duplicate dedupe, deemed-cost preload, free-plan
  masking, warning composition) and is unit-tested only transitively via the
  engine tests. `app/actions/__tests__/account.test.ts` shows the team has the
  capability to mock Supabase.
  - Fix: add `calculate.test.ts` that mocks `parseFile` + `DBExchangeRateProvider`
    and asserts the `wire.warnings` composition + free masking.

- **`app/api/report/route.ts:60` — `POST` has no test**
  Origin check (line 34), rate-limit (line 71), premium guard (line 93),
  totalAverage-only PDF gate (line 142), server-side recalculation (line
  155–173), and rate metadata stitching (line 180) are all interesting branches
  that only get coverage if the engine + validation pass through.
  - Fix: add `route.test.ts` mocking `request.json()` + `requirePremium` to
    cover at least the origin-block, method-block, and happy path.

### Server / client boundary

- **`lib/mock/tax.ts:1` and `lib/mock/transactions.ts:1` use `'use client'`**
  These files use `localStorage` and `window` — the directive is technically
  fine, but the *content* of the file is essentially "convert Wire types from
  server payload into client viewmodel". Naming it `mock/` after the data is
  no longer mock is misleading.
  - Fix: rename `lib/mock/tax.ts` → `lib/client/tax-view.ts`,
    `lib/mock/transactions.ts` → `lib/client/transactions-view.ts`, prune the
    dead exports above, and drop the `lib/mock` directory.

---

## P2 (nice-to-have)

### Repeated boilerplate in server actions

- **`app/actions/imputed-expense.ts` + `app/actions/deemed-cost.ts`**
  Both files repeat the same shape: `try { COIN_PATTERN check → requirePremium
  → supabase upsert/delete → error log + i18n message } catch { unexpected
  error }`. Six near-identical error strings ("저장 중 오류", "삭제 중 오류",
  "예기치 못한 오류", "코인 형식이 올바르지 않습니다").
  - Fix: extract a `withCoinPremiumGuard(coin, fn)` helper in a new
    `lib/auth/action-helpers.ts` that runs validation, premium gate, and
    standard error mapping. Saves ~30 LOC and ensures consistent UX strings.

### Inconsistent rate-limit error message location

- **`app/actions/calculate.ts:86` + `app/api/report/route.ts:78`** both hard-code
  `'요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'` — should live in
  `lib/rate-limit.ts` as a constant alongside `getReportRateLimit` /
  `getCalculateRateLimit`.

### Two `Plan` type definitions

- `lib/auth/index.ts:13` exports `type Plan = 'free' | 'premium'`
- `lib/auth/server.ts:7` exports `type Plan = 'free' | 'premium'`

Identical, but separate. If they ever diverge (e.g. adding `'onetime'`)
nothing forces the update on both sides.
  - Fix: move to `lib/auth/types.ts` (no `'use client'` directive needed) and
    re-export from both files.

### `lib/email/send.ts:97,113` dormant exports

`sendVerifyEmail` and `sendResetPasswordEmail` are documented as dormant
(comment lines 12–16) and have zero callers. They build static HTML via the
`build-emails` script, so the email templates stay in use — only the runtime
send wrappers are dormant. Acceptable to keep with the warning comment.
  - Fix: keep, but consider moving them to
    `lib/email/dormant-sends.ts` so `lib/email/send.ts` only exposes what's
    live (`sendWelcomeEmail`).

### Sibling import patterns

`scripts/build-emails.ts` is the only file in the repo using relative
parent-directory imports (`../emails/...`). Every other file uses `@/`
aliases. Low-impact since `scripts/` runs through `tsx`, but inconsistent.
  - Fix: switch to `@/emails/...` (verify `tsx` picks up the tsconfig paths
    via `vite-tsconfig-paths` equivalent).

### Component patterns

- **`app/(app)/tax/page.tsx` — 1039 LOC**
  Top of the LOC list. Contains 5 sub-components (`CalcRow`, `Divider`,
  `PremiumBanner`, `HoldingsAfterTable`, `ExchangeCoinMatrix`, `RealizedGainList`,
  `BlurOverlay`) + the main `TaxPage`. Three of the sub-components are
  table-shaped (`HoldingsAfterTable`, `ExchangeCoinMatrix`, `RealizedGainList`)
  and could move to `app/(app)/tax/_components/` for breathability without
  hurting tree-shaking.
  - Fix: extract sub-components to a co-located `_components/` dir; the
    page-level component drops from ~1000 to ~500 LOC.

- **`app/(app)/transactions/page.tsx` (469) / `dashboard/page.tsx` (341) /
  `app/(app)/tax/deemed-cost/page.tsx` (472)**
  All hover around the 300–500 LOC range. Less urgent than `tax/page.tsx` but
  same pattern (helper sub-components living next to the page render).

- **`components/app-chrome/AppShell.tsx` → `Topbar` → `MobileDrawer` /
  `Sidebar` / `UserMenu`** — props-drills `user: User` four levels deep.
  Manageable for now (it's literally one prop, and `User` is stable), but if
  more shell state lands (e.g. plan badge, notification count), context is
  the cleaner play.

### Strict-mode opportunities

`tsconfig.json` enables `strict: true` but not the optional `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, or `useUnknownInCatchVariables`. With zero `any`
and no `@ts-ignore` in the codebase, turning these on is low-risk and would
catch the `s.lots[0]?.amount ?? g.sellAmount` shapes in `tax/page.tsx:397`
without ceremony.
  - Fix: enable `noUncheckedIndexedAccess` first, fix the resulting errors,
    then evaluate the others.

### Logging hygiene

`console.error` and `console.warn` are used 31 times across server actions
and routes. All callsites are guarded paths (auth failures, DB errors, rate
limit fail-closed). The messages do contain error details — none look like
they'd leak PII, but `[deleteAccount] profiles delete error:` and
`[saveSnapshot] supabase error: error.message` include the raw Supabase
message, which can leak schema names.
  - Fix: route through a tiny `lib/log.ts` that strips known sensitive keys
    in production (`SUPABASE_SERVICE_ROLE_KEY`, JWTs in error messages). Low
    urgency; nothing is leaking today.

### Inline `style={{...}}` for gradients

`app/(app)/tax/page.tsx:90,757,829,891` and similar in tax/deemed-cost,
sample pages set background gradients inline. Six near-identical
`linear-gradient(135deg, rgb(var(--brand)) 0%, rgb(124,58,237) 100%)` strings
across the codebase.
  - Fix: add a `bg-brand-purple-gradient` utility to `tailwind.config.ts` and
    swap in `className`.

---

## Verified clean

- **TODO / FIXME / XXX**: zero. (`grep -rEn "TODO|FIXME|XXX" --include='*.ts'
  --include='*.tsx'` returns no production matches.)
- **`any` types**: zero outside two comments in `lib/parsers/upbit.parser.ts:33`
  ("any letters/digits") and `lib/engine/moving-average.ts:75` (variable
  named `anyDeemed`). No `: any`, `as any`, `<any>`, or
  `Record<string, any>` in production code. Test files use
  `Record<string, unknown>` (correct).
- **`@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`**: zero.
- **`as unknown as`**: 3 occurrences total — all justified Zod-output → typed
  shape coercions (`lib/storage/session.ts:103,237`, `app/actions/user-data.ts:99`).
- **Non-null assertions (`x!`)**: only on `process.env.NEXT_PUBLIC_SUPABASE_URL!`
  and one `byYear.get(y)!.push(...)` in `lib/engine/total-average.ts:124`
  where the key was just `set()`. All justified.
- **Skipped tests**: zero (`test.skip`, `it.skip`, `describe.skip` all clean).
- **`.only` in tests**: zero.
- **`console.log`**: zero in production code; only in `scripts/build-emails.ts`
  (legitimate CLI output).
- **Promise hygiene**: `Promise.all` used in 3 expected places
  (`resolveDeemedCostPrices`, the report route, the deemed-cost page).
  No unhandled promise patterns spotted; fire-and-forget calls (`void
  saveSnapshot(...)` in `lib/storage/session.ts:130`,
  `lib/auth/index.ts:81,91`) all have `.catch` handlers.
- **CSP / security headers**: `next.config.mjs:8–37` is a real Content-Security-Policy
  including `frame-ancestors 'none'`, `object-src 'none'`,
  `form-action 'self'`. Production-grade.
- **Rate limit fail-closed**: `lib/rate-limit.ts:93` returns `{ ok: false }`
  on Redis error rather than fail-open. Good.
- **`'use server'` placement**: all six server-action files
  (`app/actions/*.ts`) start with `'use server';` — none leak into
  `'use client'` files.
- **`'use client'` placement**: every page that uses hooks/localStorage starts
  with `'use client';`. `lib/auth/index.ts` correctly marks itself client (uses
  `useEffect`); `lib/auth/server.ts` is correctly server-only.
- **Server-only API leakage**: no imports of `createSupabaseServerClient` /
  `createSupabaseAdminClient` from client code.
- **Path aliases**: 100% of non-test imports use `@/`; only
  `scripts/build-emails.ts` uses `../`.
- **Dependency hygiene**: every dependency in `package.json` is imported
  somewhere in source. `papaparse` (binance parser), `pdf-parse` (upbit
  parser), `pretendard` (font), `@react-pdf/renderer` (PDF), `resend` (email),
  `@upstash/ratelimit` (rate limit), `uuid` (engine), `zod` (validation),
  `@supabase/ssr` (auth) all wired.
- **Tailwind config**: every color token in `tailwind.config.ts` resolves to
  a CSS var defined in `app/globals.css`; static palettes (`step`, `accent`,
  `exchange`, `coin`) are all referenced from at least one section/component.
  No safelist, no dead utilities.
- **`vitest.config.ts`**: uses `vite-tsconfig-paths` so `@/` aliases resolve
  in tests — clean.
- **Naming**: DB columns (`premium_until`, `from_currency`, `price_krw`) stay
  snake_case in TS interface declarations (`ProfileRow`, `DBRow`,
  `DeemedSnapshotRow`); camelCase used elsewhere. No mixing inside the same
  scope.
- **Korean vs English in file/identifier names**: file names all English; only
  user-facing strings + comments are Korean. Consistent.
