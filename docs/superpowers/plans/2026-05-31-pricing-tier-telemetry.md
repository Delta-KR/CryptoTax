# 건수 티어 의사결정 telemetry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가격 티어 의사결정을 데이터로 하기 위해, 매 세금 계산 시 거래 건수·거래소수·코인수 + 양도차익/세액 bucket 을 Supabase 에 익명 집계로 남긴다 (가격은 안 건드림).

**Architecture:** `calculate.ts` 의 `calculateTaxFromFiles()` return 직전에 authed user 한정 fire-and-forget insert. 원값 저장 0 — KRW 는 모두 bucket 화. 신규 Supabase 테이블 `pricing_telemetry` (기존 `user_data` RLS·CASCADE 패턴 답습). bucket 변환은 순수 함수로 분리해 단위 테스트.

**Tech Stack:** Next.js 14 server action · Supabase (Postgres + RLS) · vitest · TypeScript

**Spec:** [docs/superpowers/specs/2026-05-31-pricing-tier-telemetry-design.md](../specs/2026-05-31-pricing-tier-telemetry-design.md)

---

## File Structure

| 파일 | 책임 | 신규/수정 |
|------|------|----------|
| `lib/telemetry/buckets.ts` | netPnLKRW·taxAmountKRW → bucket 문자열 (순수 함수) | 신규 |
| `lib/telemetry/__tests__/buckets.test.ts` | bucket 경계값 단위 테스트 | 신규 |
| `lib/telemetry/pricing.ts` | `recordPricingTelemetry()` — authed insert (얇은 매퍼) | 신규 |
| `supabase/migrations/20260531000000_create_pricing_telemetry.sql` | 테이블 + RLS + 인덱스 | 신규 |
| `app/actions/calculate.ts` | return 직전 telemetry 호출 1블록 | 수정 |
| `TASKS.md` | 💰 가격 전략 §P3 항목 추가 | 수정 |

확정 사실 (탐색 완료):
- `import { createSupabaseServerClient } from '@/lib/supabase/server'` (함수명 `createSupabaseServerClient`, async — `user-data.ts` 가 쓰는 패턴)
- `import { getAuthedUser } from '@/lib/auth/server'` (React.cache — 재호출 무료)
- `ParsedTransaction` 에 `.exchange` · `.coin` 존재 (`lib/engine/types.ts:55,57`)
- 엔진 `result` 에 `.netPnLKRW` · `.taxAmountKRW` 존재 (`lib/engine/tax-calculator.ts:310,312`)
- vitest: `import { describe, it, expect } from 'vitest'` + `@/` alias 동작
- npm scripts: `test` = `vitest run`, `typecheck` = `tsc --noEmit`
- `lib/telemetry/` 미존재 (신규 디렉터리)

---

## Task 1: bucket 순수 함수 + 단위 테스트

**Files:**
- Create: `lib/telemetry/buckets.ts`
- Test: `lib/telemetry/__tests__/buckets.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `lib/telemetry/__tests__/buckets.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toGainBucket, toTaxBucket } from '@/lib/telemetry/buckets';

describe('toGainBucket', () => {
  it('손실·0 은 none', () => {
    expect(toGainBucket(-1_000_000)).toBe('none');
    expect(toGainBucket(0)).toBe('none');
  });
  it('0 초과 ~ 250만 미만은 under_250', () => {
    expect(toGainBucket(1)).toBe('under_250');
    expect(toGainBucket(2_499_999)).toBe('under_250');
  });
  it('250만 경계는 under_1000 (공제 한도)', () => {
    expect(toGainBucket(2_500_000)).toBe('under_1000');
    expect(toGainBucket(9_999_999)).toBe('under_1000');
  });
  it('1천만 ~ 5천만 미만은 under_5000', () => {
    expect(toGainBucket(10_000_000)).toBe('under_5000');
    expect(toGainBucket(49_999_999)).toBe('under_5000');
  });
  it('5천만 이상은 over_5000 (고래 fat tail)', () => {
    expect(toGainBucket(50_000_000)).toBe('over_5000');
    expect(toGainBucket(100_000_000)).toBe('over_5000');
  });
});

describe('toTaxBucket', () => {
  it('0 이하는 none', () => {
    expect(toTaxBucket(-5)).toBe('none');
    expect(toTaxBucket(0)).toBe('none');
  });
  it('0 초과 ~ 100만 미만은 under_100', () => {
    expect(toTaxBucket(1)).toBe('under_100');
    expect(toTaxBucket(999_999)).toBe('under_100');
  });
  it('100만 ~ 500만 미만은 under_500', () => {
    expect(toTaxBucket(1_000_000)).toBe('under_500');
    expect(toTaxBucket(4_999_999)).toBe('under_500');
  });
  it('500만 ~ 2천만 미만은 under_2000 (구독 ROI)', () => {
    expect(toTaxBucket(5_000_000)).toBe('under_2000');
    expect(toTaxBucket(19_999_999)).toBe('under_2000');
  });
  it('2천만 이상은 over_2000', () => {
    expect(toTaxBucket(20_000_000)).toBe('over_2000');
    expect(toTaxBucket(99_999_999)).toBe('over_2000');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/telemetry/__tests__/buckets.test.ts`
Expected: FAIL — "Failed to resolve import '@/lib/telemetry/buckets'" (파일 미존재)

- [ ] **Step 3: 최소 구현**

Create `lib/telemetry/buckets.ts`:

```ts
// 건수 티어 의사결정 telemetry — KRW 원값 → bucket 변환 (순수 함수).
// 원값 저장 금지 정책: 양도차익·세액은 반드시 이 함수로 구간화 후 저장.
// 경계 근거: spec docs/superpowers/specs/2026-05-31-pricing-tier-telemetry-design.md §3.1

export type GainBucket =
  | 'none'
  | 'under_250'
  | 'under_1000'
  | 'under_5000'
  | 'over_5000';

export type TaxBucket =
  | 'none'
  | 'under_100'
  | 'under_500'
  | 'under_2000'
  | 'over_2000';

/** 양도차익(손익 통산 net) → bucket. 250만=기본공제(세금 0 분기), 5천만=고래 식별선. */
export function toGainBucket(netPnLKRW: number): GainBucket {
  if (netPnLKRW <= 0) return 'none';
  if (netPnLKRW < 2_500_000) return 'under_250';
  if (netPnLKRW < 10_000_000) return 'under_1000';
  if (netPnLKRW < 50_000_000) return 'under_5000';
  return 'over_5000';
}

/** 산출세액(소득세+지방세) → bucket. 500/2000만=구독 ROI 분기점. */
export function toTaxBucket(taxAmountKRW: number): TaxBucket {
  if (taxAmountKRW <= 0) return 'none';
  if (taxAmountKRW < 1_000_000) return 'under_100';
  if (taxAmountKRW < 5_000_000) return 'under_500';
  if (taxAmountKRW < 20_000_000) return 'under_2000';
  return 'over_2000';
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/telemetry/__tests__/buckets.test.ts`
Expected: PASS — 10 tests passed

- [ ] **Step 5: 커밋**

```bash
git add lib/telemetry/buckets.ts lib/telemetry/__tests__/buckets.test.ts
git commit -m "feat(telemetry): gain/tax bucket 순수 함수 + 경계 테스트"
```

---

## Task 2: Supabase 마이그레이션 파일

**Files:**
- Create: `supabase/migrations/20260531000000_create_pricing_telemetry.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

Create `supabase/migrations/20260531000000_create_pricing_telemetry.sql`:

```sql
-- pricing_telemetry — 건수 티어 의사결정용 telemetry (CLAUDE.md P3 / 💰 가격 전략).
--
-- 목적: 가격 티어를 데이터로 결정. MVP 가격(₩49,900 단일)은 안 건드리고
-- 측정 장치만. 핵심 질문 = (1) 거래 건수 분포 (2) 고건수가 세금도 많은가
-- (3) 무제한 구독 escape 비율. 첫 시즌 데이터로 답.
--
-- Privacy: 원값 저장 0 — KRW·코인명·거래소명 제외, bucket 만. authed user 만
-- insert (익명 IP fallback 안 함 — PIPA 키 회피). RRN 미수집(전체 정책). RLS
-- SELECT 정책 없음 → 본인도 조회 불가, service_role 만 분석. CASCADE 자동 정리.
-- 패턴: user_data (20260523020000) 답습.

CREATE TABLE IF NOT EXISTS public.pricing_telemetry (
  id           bigserial PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- cost-to-serve proxy
  tx_count       int NOT NULL CHECK (tx_count >= 0),
  exchange_count smallint NOT NULL CHECK (exchange_count >= 0),
  coin_count     smallint NOT NULL CHECK (coin_count >= 0),

  -- WTP proxy — bucket only, 원값 저장 0
  gain_bucket text NOT NULL CHECK (gain_bucket IN ('none','under_250','under_1000','under_5000','over_5000')),
  tax_bucket  text NOT NULL CHECK (tax_bucket  IN ('none','under_100','under_500','under_2000','over_2000')),

  -- 결제 컨텍스트
  plan           text NOT NULL CHECK (plan IN ('free','onetime','premium')),
  method         text NOT NULL CHECK (method IN ('totalAverage','fifo','avg')),
  year           smallint NOT NULL,
  deemed_applied boolean NOT NULL
);

CREATE INDEX IF NOT EXISTS pricing_telemetry_created_at_idx
  ON public.pricing_telemetry (created_at DESC);
CREATE INDEX IF NOT EXISTS pricing_telemetry_user_id_idx
  ON public.pricing_telemetry (user_id);

ALTER TABLE public.pricing_telemetry ENABLE ROW LEVEL SECURITY;

-- 본인 row insert 만 허용. SELECT/UPDATE/DELETE 정책 없음 (service_role 만 분석).
CREATE POLICY pricing_telemetry_insert_own ON public.pricing_telemetry
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.pricing_telemetry IS
  '건수 티어 의사결정용 telemetry (CLAUDE.md P3). 원값 0 — bucket 만. authed user 만 insert. 분석은 service_role.';
```

- [ ] **Step 2: SQL 문법 sanity 확인 (로컬, dry parse)**

Run: `grep -c "CREATE\|POLICY\|INDEX" supabase/migrations/20260531000000_create_pricing_telemetry.sql`
Expected: 5 이상 (CREATE TABLE 1 + CREATE INDEX 2 + CREATE POLICY 1 + 본문 CHECK 등) — 파일이 정상 작성됐는지만 확인. 실제 적용은 Task 5.

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260531000000_create_pricing_telemetry.sql
git commit -m "feat(db): pricing_telemetry 테이블 마이그레이션 (RLS insert-only)"
```

---

## Task 3: recordPricingTelemetry insert 함수

**Files:**
- Create: `lib/telemetry/pricing.ts`

이 함수는 Supabase 클라이언트에 의존하는 얇은 매퍼다. 테스트 가능한 로직(bucket 변환)은 Task 1 에서 이미 커버됐으므로, 여기선 단위 테스트 없이 Task 5 통합 검증으로 확인한다 (Supabase 클라이언트 모킹은 가치 대비 비용이 큼 — YAGNI).

- [ ] **Step 1: 구현 작성**

Create `lib/telemetry/pricing.ts`:

```ts
import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toGainBucket, toTaxBucket } from '@/lib/telemetry/buckets';

export interface PricingTelemetryInput {
  userId: string;
  txCount: number;
  exchangeCount: number;
  coinCount: number;
  netPnLKRW: number;
  taxAmountKRW: number;
  plan: 'free' | 'onetime' | 'premium';
  method: 'totalAverage' | 'fifo' | 'avg';
  year: number;
  deemedApplied: boolean;
}

/**
 * 건수 티어 의사결정용 telemetry 1행 insert. authed user 한정.
 * 원값(KRW)은 bucket 으로만 저장. caller 가 fire-and-forget 으로 호출하고
 * .catch 로 에러를 흡수한다 (본 계산 응답 영향 0).
 */
export async function recordPricingTelemetry(
  input: PricingTelemetryInput,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('pricing_telemetry').insert({
    user_id: input.userId,
    tx_count: input.txCount,
    exchange_count: input.exchangeCount,
    coin_count: input.coinCount,
    gain_bucket: toGainBucket(input.netPnLKRW),
    tax_bucket: toTaxBucket(input.taxAmountKRW),
    plan: input.plan,
    method: input.method,
    year: input.year,
    deemed_applied: input.deemedApplied,
  });
  if (error) throw error;
}
```

- [ ] **Step 2: typecheck 통과 확인**

Run: `npm run typecheck`
Expected: PASS — 에러 0건 (`recordPricingTelemetry` 시그니처·import 정상 resolve)

- [ ] **Step 3: 커밋**

```bash
git add lib/telemetry/pricing.ts
git commit -m "feat(telemetry): recordPricingTelemetry authed insert 매퍼"
```

---

## Task 4: calculate.ts 에 telemetry 호출 wire

**Files:**
- Modify: `app/actions/calculate.ts` (import 추가 + return 직전 블록)

- [ ] **Step 1: import 추가**

`app/actions/calculate.ts` 의 import 블록 — `getAuthedUser` 는 이미 L15 에서 import 중 (`import { getAuthedUser, getEffectivePlan } from '@/lib/auth/server';`). 아래 한 줄만 추가 (resolvers import 다음, L38 근처):

```ts
import { recordPricingTelemetry } from '@/lib/telemetry/pricing';
```

- [ ] **Step 2: return 직전 telemetry 블록 추가**

`app/actions/calculate.ts` 의 `payload` 정의(L259-266) 다음, `return { ok: true, payload };` (L267) **직전**에 추가:

```ts
    // 건수 티어 의사결정 telemetry (💰 가격 전략 P3). authed user 한정 fire-and-forget.
    // 원값 미저장 — bucket 변환은 recordPricingTelemetry 내부. 실패해도 응답 영향 0.
    const telemetryUser = await getAuthedUser(); // React.cache — 재호출 무료
    if (telemetryUser) {
      void recordPricingTelemetry({
        userId: telemetryUser.id,
        txCount: allParsed.length,
        exchangeCount: new Set(allParsed.map((tx) => tx.exchange)).size,
        coinCount: new Set(allParsed.map((tx) => tx.coin)).size,
        netPnLKRW: result.netPnLKRW,
        taxAmountKRW: result.taxAmountKRW,
        plan,
        method,
        year,
        deemedApplied: preCoinsSet.size > 0,
      }).catch((e) => {
        console.error('[pricing_telemetry] insert failed:', e);
      });
    }

    return { ok: true, payload };
```

주의:
- `result` 는 엔진 결과(`calculateTax` 반환, L195) — `.netPnLKRW`·`.taxAmountKRW` 보유. wire(`finalResult`) 아님.
- `allParsed`(L162)·`preCoinsSet`(L178)·`plan`(L204)·`method`(L154)·`year`(L191) 모두 이 시점 스코프 내.
- `void` + `.catch` 로 fire-and-forget — `await` 안 함.

- [ ] **Step 3: typecheck 통과 확인**

Run: `npm run typecheck`
Expected: PASS — 에러 0건

- [ ] **Step 4: 전체 테스트 통과 확인 (회귀 없음)**

Run: `npm test`
Expected: PASS — 기존 테스트 전부 통과 + buckets 10건. 계산 로직 변경 0이라 회귀 없어야 정상.

- [ ] **Step 5: 커밋**

```bash
git add app/actions/calculate.ts
git commit -m "feat(telemetry): calculate return 직전 telemetry 호출 wire"
```

---

## Task 5: prod 마이그레이션 적용 + 검증 (사용자 동의 후)

**Files:** 없음 (Supabase MCP 작업)

CLAUDE.md 작업 패턴 4) — prod 영향이라 사용자 명시 허락 후만. `apply_migration` 은 reversible 어려움.

- [ ] **Step 1: 사용자 동의 확인**

prod 적용 전 사용자에게 "마이그레이션 prod apply 진행할까요?" 확인. 동의(`ㄱㄱ` 등) 받기.

- [ ] **Step 2: 마이그레이션 적용**

`mcp__supabase__apply_migration` 호출:
- name: `create_pricing_telemetry`
- query: `supabase/migrations/20260531000000_create_pricing_telemetry.sql` 전체 내용

Expected: 성공 (에러 없음)

- [ ] **Step 3: 테이블·RLS 존재 확인**

`mcp__supabase__list_tables` (schemas: ['public']) 호출.
Expected: `pricing_telemetry` 존재, `rls_enabled: true`

- [ ] **Step 4: advisor 확인 (RLS warning 0)**

`mcp__supabase__get_advisors` (type: 'security') 호출.
Expected: `pricing_telemetry` 관련 신규 warning 0건 (RLS enabled + insert 정책 존재). 기존 free-tier `auth_leaked_password_protection` 1건은 무시 (CLAUDE.md 알려진 함정).

- [ ] **Step 5: insert smoke test (RLS WITH CHECK 동작 확인)**

`mcp__supabase__execute_sql` 로 빈 SELECT 확인:
```sql
SELECT count(*) FROM pricing_telemetry;
```
Expected: 0 (아직 insert 전). 에러 없이 쿼리 동작 = 테이블 정상.

> 실사용자 insert 검증은 prod 에서 로그인 후 1회 계산 실행 → `SELECT count(*)` 1+ 확인 (사용자 영역, 별도 turn).

---

## Task 6: TASKS.md 💰 가격 전략 §P3 항목 추가

**Files:**
- Modify: `TASKS.md` (💰 가격 전략 섹션, P1 가치 노출 UX 다음)

- [ ] **Step 1: P3 항목 추가**

`TASKS.md` 의 "### P1 — 가치 노출 UX" 블록 끝(구독 features 재정의 항목 다음, "### P2 — 사전 예약(LOI)" 직전)에 신규 블록 추가:

```markdown
### P3 — 건수 티어 의사결정 telemetry

- [x] **파서 telemetry 로깅 — 건수 티어 결정용** — 가격은 안 건드리고 측정 장치만. `calculate.ts` return 직전 authed user 한정 fire-and-forget insert (`supabase/migrations/20260531000000_create_pricing_telemetry.sql`). 건수+거래소수+코인수(cost proxy) + gain/tax bucket(WTP proxy, 원값 0). **건수만으론 반쪽 — 세액 구간 같이 남겨야 "고건수=고세액인가" 답 가능** (건수 ≠ WTP). bucket 경계: gain 250만(공제)·5천만(고래) / tax 500·2000만(구독 ROI). Privacy: 원값 0·RRN 미수집·익명 제외·RLS SELECT 없음(service_role 만 분석)·CASCADE. spec [docs/superpowers/specs/2026-05-31-pricing-tier-telemetry-design.md](docs/superpowers/specs/2026-05-31-pricing-tier-telemetry-design.md). Phase 7 온보딩 funnel(페이지 drop-off)과 중복 X — 이건 결제 가치 분포(server 비즈니스 이벤트). **가격 결정은 LOI 100명 + 첫 시즌 분포 데이터 나온 후** ("고래 fat tail 존재?"가 첫 질문)
```

> 체크박스 상태: 구현 완료 시점에 `[x]`. 만약 prod apply(Task 5) 가 사용자 동의 대기로 미완이면 `[ ]` 로 두고 "코드 머지·prod apply 대기" 명시.

- [ ] **Step 2: 커밋**

```bash
git add TASKS.md
git commit -m "docs(tasks): P3 건수 티어 의사결정 telemetry 항목 추가"
```

---

## Self-Review 결과

**Spec coverage** (spec §1-§10 대조):
- §2 트리거 위치/fire-and-forget/저장소 → Task 4 / Task 2·3 ✓
- §3 스키마 + bucket 정의 → Task 2 (SQL) + Task 1 (함수) ✓
- §4 Privacy (원값 0·RRN·익명 제외·RLS) → Task 2 SQL 정책 ✓
- §5 모듈 구조 → Task 1·3 (buckets.ts / pricing.ts) ✓
- §6 테스트 (10 case) → Task 1 ✓
- §7 운영 query → spec 에 보존 (구현 산출물 아님, 운영 시 사용) — 의도적 plan 제외
- §9 마이그 적용 절차 → Task 5 ✓
- §10 결정 기록 → spec 에 보존 ✓

**Placeholder scan:** 모든 step 에 실제 코드/명령 포함. TBD·"적절히"·"유사" 없음 ✓

**Type consistency:**
- `toGainBucket`·`toTaxBucket` 시그니처 Task 1↔3 일치 ✓
- `PricingTelemetryInput` 필드 ↔ Task 4 호출 인자 일치 (userId/txCount/exchangeCount/coinCount/netPnLKRW/taxAmountKRW/plan/method/year/deemedApplied) ✓
- SQL 컬럼 ↔ insert 객체 key 일치 (snake_case) ✓
- bucket CHECK 제약 ↔ 함수 반환 문자열 일치 ✓

갭 없음.
