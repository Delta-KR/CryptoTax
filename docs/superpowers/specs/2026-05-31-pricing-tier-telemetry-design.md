# P3 — 건수 티어 의사결정 telemetry

> 작성: 2026-05-31 · brainstorming → design · TASKS.md 💰 가격 전략 §P3

## 1. 목적

가격 티어를 **데이터로** 결정하기 위한 측정 인프라. MVP 가격(₩49,900 단일 정액)은 안 건드린다. 측정 장치만 박는다.

핵심 질문 — 첫 시즌 데이터로 답을 보고 싶다:

1. 사용자 거래 건수 분포는 어떻게 생겼는가 (long tail 존재 여부)
2. 고건수 사용자가 진짜 세금도 많은가, 아니면 세금 0인 단타충인가
3. 무제한 구독으로 escape 할 사용자가 몇 %인가

위 셋이 답이 안 나오면 건수 티어(원타임 ₩49,900 + α / 구독 ₩89,000 + α 무제한) 도입은 **데이터 없이 감으로** 결정하게 된다. 지금 측정 장치만 박아두면 LOI 100명 + 첫 시즌 데이터로 의사결정 가능.

비목적 (NOT this spec):
- 가격 변경
- 결제 funnel drop-off 측정 (Phase 7 온보딩 funnel — 별도 작업)
- 익명 사용자 행동 추적 (PostHog 류 — 향후 별도 결정)

## 2. Architecture

### 2.1 트리거 위치

`app/actions/calculate.ts` 의 `calculateTaxFromFiles()` return 직전.

이 시점에 다 결정돼 있다:
- `result` (totalGain/totalLoss/netPnL/taxAmount 등 wire-ready)
- `plan` (free / onetime / premium)
- `allParsed`, `unified` (거래 건수·거래소·코인)
- `method`, `year`
- `preCoinsSet.size > 0` (의제취득가액 적용 여부)

### 2.2 fire-and-forget

```ts
// authed user 만. 익명은 결제 의지 0 가정 → telemetry 노이즈만
if (user) {
  recordPricingTelemetry({ ... }).catch((e) => {
    console.error('[pricing_telemetry] insert failed:', e);
  });
}
```

- `await` 안 함 → 사용자 응답 latency 영향 0
- 실패해도 본 응답 영향 0 (try/catch 격리)

### 2.3 저장소

Supabase 신규 테이블 `pricing_telemetry`. 기존 `user_data` 마이그레이션 패턴 그대로 (RLS · CASCADE on user delete).

외부 분석 도구(PostHog 등) 안 씀 — 추가 의존성 0, Supabase MCP 로 admin 분석 즉시 가능, CLAUDE.md PII 격리 정책과 정합.

## 3. 스키마

```sql
-- supabase/migrations/20260531000000_create_pricing_telemetry.sql

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

CREATE INDEX pricing_telemetry_created_at_idx ON public.pricing_telemetry (created_at DESC);
CREATE INDEX pricing_telemetry_user_id_idx   ON public.pricing_telemetry (user_id);

ALTER TABLE public.pricing_telemetry ENABLE ROW LEVEL SECURITY;

-- 본인 row insert 만 허용
CREATE POLICY pricing_telemetry_insert_own ON public.pricing_telemetry
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SELECT/UPDATE/DELETE 정책 없음 → 본인도 조회 불가, service_role 만 분석
-- (postgres role 또는 supabase dashboard SQL editor)

COMMENT ON TABLE public.pricing_telemetry IS
  '건수 티어 의사결정용 telemetry (CLAUDE.md P3). 원값 0 — bucket 만. authed user 만 insert. 분석은 service_role.';
```

### 3.1 Bucket 정의

**gain_bucket** — 양도차익 (손익 통산 net, `result.netPnLKRW`):

| bucket | 범위 (KRW) | 근거 |
|--------|------------|------|
| `none` | 0 이하 (손실) | 손실 사용자도 신고 필요 — 무료/원타임 구간 |
| `under_250` | 0 ~ 2,500,000 | 기본공제(250만원) 한도 — **세금 0** 분기점 |
| `under_1000` | 2,500,000 ~ 10,000,000 | 일반 투자자 |
| `under_5000` | 10,000,000 ~ 50,000,000 | 중간 투자자 |
| `over_5000` | 50,000,000+ | 고래 fat tail 식별선 — **티어 정당화 기준** |

**tax_bucket** — 산출세액 (소득세 + 지방세, `result.taxAmountKRW`):

| bucket | 범위 (KRW) | 근거 |
|--------|------------|------|
| `none` | 0 | 공제 한도 이하 |
| `under_100` | 0 ~ 1,000,000 | 소액 |
| `under_500` | 1,000,000 ~ 5,000,000 | 일반 |
| `under_2000` | 5,000,000 ~ 20,000,000 | **구독 ROI 분기점** (₩89,000/년 가치 명확) |
| `over_2000` | 20,000,000+ | 고가치 사용자 |

### 3.2 Bucket 도우미

```ts
// lib/telemetry/buckets.ts

export function toGainBucket(netPnLKRW: number): string {
  if (netPnLKRW <= 0) return 'none';
  if (netPnLKRW < 2_500_000) return 'under_250';
  if (netPnLKRW < 10_000_000) return 'under_1000';
  if (netPnLKRW < 50_000_000) return 'under_5000';
  return 'over_5000';
}

export function toTaxBucket(taxAmountKRW: number): string {
  if (taxAmountKRW <= 0) return 'none';
  if (taxAmountKRW < 1_000_000) return 'under_100';
  if (taxAmountKRW < 5_000_000) return 'under_500';
  if (taxAmountKRW < 20_000_000) return 'under_2000';
  return 'over_2000';
}
```

## 4. Privacy (CLAUDE.md PII 위협모델 정합)

- **원값 저장 0건** — KRW · 코인명 · 거래소명 · 거래 detail 모두 제외
- **RRN(주민등록번호) 미수집** — Kontaxt 전체 정책 (수집·저장·로그 모두 금지). 본 telemetry 도 동일. 거주자 판정은 OAuth 기반, RRN 요구 안 함
- **익명 사용자 제외** — IP fallback 안 함 (PIPA 개인정보 소지 키 회피)
- **CASCADE 자동 삭제** — 회원탈퇴 시 row 함께 사라짐 (Naver auto-relogin incident PR #101 과 같은 cleanup 정합)
- **본인도 조회 불가** — RLS SELECT 정책 없음. service_role 만 분석 (Supabase dashboard 또는 MCP `execute_sql`)
- **Bucket 폭 충분히 넓음** — single-row 역추적 불가. 예: 한 사용자가 `under_1000` 면 250만~1000만 구간, 특정 X

`.claude/security-patterns.json` 매칭 위험 없음:
- service_role 없음 (RLS WITH CHECK 통과 — anon/authenticated role)
- localStorage 단일키 패턴 없음 (server-side insert only)
- 원값 저장 없음 (PII 정규식 매칭 없음)

> Note — 본 spec 의 `20260531000000` 14자리 timestamp 는 `korean_rrn_pattern` 정규식의 false positive 다 (앞 6자리 + `3` + 7자리). 기존 마이그 파일들(`20260523020000_create_user_data.sql` 등)도 같은 컨벤션. 실제 RRN 수집은 codebase 전체에 0건.

## 5. 구현 모듈

```
lib/telemetry/
  buckets.ts         # toGainBucket / toTaxBucket (pure functions)
  pricing.ts         # recordPricingTelemetry() — authed insert
  __tests__/
    buckets.test.ts  # 5+5 = 10 case (경계값 포함)

app/actions/calculate.ts  # 호출만 추가 (1 블록)

supabase/migrations/
  20260531000000_create_pricing_telemetry.sql
```

### 5.1 `lib/telemetry/pricing.ts` 시그니처

```ts
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

export async function recordPricingTelemetry(input: PricingTelemetryInput): Promise<void> {
  const supabase = await createServerClient();  // authed client (RLS 적용)
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
  if (error) throw error;  // caller 의 catch 가 console.error
}
```

### 5.2 `calculate.ts` 호출

```ts
// L266 직전 (return 직전)
if (user) {
  recordPricingTelemetry({
    userId: user.id,
    txCount: allParsed.length,
    exchangeCount: new Set(allParsed.map((tx) => tx.exchange)).size,
    coinCount: new Set(unified.map((tx) => tx.coin)).size,
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
```

주의: `user` 변수는 `getRateLimitIdentifier()` 내부에서 fetch 되므로, 윗 단에서 `getAuthedUser()` 를 재호출(React.cache 로 무료) 하거나 identifier 파싱으로 재추출.

## 6. 테스트

### 6.1 `__tests__/buckets.test.ts`

- toGainBucket: -100만 / 0 / 1만 / 250만 / 250만+1 / 1천만 / 1천만+1 / 5천만 / 5천만+1 / 1억 → 경계 정확
- toTaxBucket: 0 / 1 / 100만 / 100만+1 / 500만 / 500만+1 / 2천만 / 2천만+1 / 1억 → 경계 정확

### 6.2 통합 검증

- 마이그 apply 후 `mcp__supabase__list_tables` 로 `pricing_telemetry` 존재 + RLS enabled 확인
- 로컬에서 calculate 1회 호출 → 본인 row 1건 insert 확인
- `mcp__supabase__execute_sql` 로 `SELECT count(*) FROM pricing_telemetry WHERE user_id = '...'`
- RLS 강제 검증: anon role 로 `SELECT * FROM pricing_telemetry` → 0 row (정책 없음)

## 7. 운영 — 분석 query

```sql
-- 1) 건수 분포 percentile (지난 90일)
SELECT
  percentile_cont(0.5)  WITHIN GROUP (ORDER BY tx_count) AS p50,
  percentile_cont(0.9)  WITHIN GROUP (ORDER BY tx_count) AS p90,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY tx_count) AS p99,
  count(*) AS n_calculations,
  count(DISTINCT user_id) AS n_users
FROM pricing_telemetry
WHERE created_at > now() - interval '90 days';

-- 2) 핵심 cross-tab: 건수 구간 × 세액 구간 → fat tail 검증
SELECT
  CASE
    WHEN tx_count <   200 THEN '1. <200'
    WHEN tx_count <  1000 THEN '2. <1k'
    WHEN tx_count <  5000 THEN '3. <5k'
    ELSE '4. 5k+'
  END AS tx_bin,
  tax_bucket,
  count(*)
FROM pricing_telemetry
GROUP BY 1, 2 ORDER BY 1, 2;
-- → 상단 우측 (5k+ × over_2000) 셀에 비중 있으면 티어 정당화

-- 3) 무제한 구독 escape 후보 비율
SELECT
  count(*) FILTER (WHERE tx_count > 1000) * 100.0 / count(*) AS pct_over_1k_tx,
  count(*) FILTER (WHERE tax_bucket IN ('under_2000','over_2000')) * 100.0 / count(*) AS pct_high_tax
FROM pricing_telemetry
WHERE created_at > now() - interval '90 days';
```

## 8. 의사결정 트리거

데이터 수집 6개월 후 (LOI 종료 + 첫 시즌 후) 다음 판단:

- p90 tx_count < 1000 + over_2000 비중 < 5% → 건수 티어 불필요, 단일 정액 유지
- 5k+ × over_2000 셀에 결제의 20%+ 집중 → 건수 티어 도입 + 구독 무제한 escape 의미 있음
- 중간 → A/B 테스트로 1~2개 티어 시험

가격 결정은 이 데이터 + LOI 100명 + PSM 설문 종합. 본 spec 은 측정 인프라만 다룬다.

## 9. 마이그레이션 적용 절차

1. `supabase/migrations/20260531000000_create_pricing_telemetry.sql` 작성
2. 로컬 `npm run typecheck && npm test` PASS
3. 사용자 확인 후 `mcp__supabase__apply_migration` 로 prod apply
4. `mcp__supabase__get_advisors` 로 RLS warning 0건 확인
5. prod 1회 calculate 호출 → `SELECT count(*) FROM pricing_telemetry` 1+ 확인

## 10. 결정 기록

- **익명 사용자**: 완전 제외 (A) — 결제 의지 0 가정 + PIPA IP 키 회피
- **bucket 경계**: 제안 그대로 (gain 5구간 / tax 5구간) — 250만(공제) / 5천만(고래) / 500·2000만(구독 ROI) 분기점
- **저장소**: Supabase 신규 테이블 — user_data 패턴 답습, 외부 분석 도구 미도입
- **트리거**: calculate.ts 1회 (매 계산마다) — 동일 사용자 여러 row 가능 (재계산 흐름 그 자체가 분석 신호)
