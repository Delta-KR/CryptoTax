// 소득세법 §64의3② — 분리과세 가상자산 기타소득의 세율 20%, 기본공제 250만원.
// 지방세 2%는 양도소득세 20% × 지방소득세 10%로 산정되며 별도 신고·납부 대상.
// UI/리포트에서는 22% 단일 표기 대신 소득세 20% + 지방세 2%로 분리 노출.
export const TAX_CONSTANTS = {
  DEDUCTION_KRW: 2_500_000,
  INCOME_TAX_RATE: 0.20,
  LOCAL_TAX_RATE: 0.02,
  TOTAL_TAX_RATE: 0.22,
  DEEMED_COST_DATE: '2026-12-31',
  TAX_START_DATE: '2027-01-01',
} as const;

export const COIN_PRECISION = 8;
const COIN_FACTOR = 10 ** COIN_PRECISION;

export function roundCoin(x: number): number {
  return Math.round(x * COIN_FACTOR) / COIN_FACTOR;
}

export function roundKRW(x: number): number {
  return Math.round(x);
}
