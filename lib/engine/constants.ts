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
