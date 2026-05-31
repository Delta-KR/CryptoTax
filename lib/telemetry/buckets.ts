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
