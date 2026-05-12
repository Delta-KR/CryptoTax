import type { UnifiedTransaction } from './types';
import { TAX_CONSTANTS } from './constants';

const TAX_START_KST_MS = new Date(
  `${TAX_CONSTANTS.TAX_START_DATE}T00:00:00+09:00`,
).getTime();

export function isPreDeemedDate(date: Date): boolean {
  return date.getTime() < TAX_START_KST_MS;
}

export function applyDeemedCost(
  tx: UnifiedTransaction,
  snapshotPrices?: Map<string, number>,
): { pricePerUnitKRW: number; isDeemedCost: boolean } {
  if (tx.type !== 'BUY' || !isPreDeemedDate(tx.date)) {
    return { pricePerUnitKRW: tx.pricePerUnitKRW, isDeemedCost: false };
  }

  const snapshot = snapshotPrices?.get(tx.coin);
  if (snapshot === undefined) {
    throw new Error(
      `의제취득가액 적용 불가: ${tx.coin}의 ${TAX_CONSTANTS.DEEMED_COST_DATE} 기준 시가가 누락되었습니다`,
    );
  }

  return {
    pricePerUnitKRW: Math.max(tx.pricePerUnitKRW, snapshot),
    isDeemedCost: true,
  };
}
