// Engine ↔ Wire 변환. Date <-> ISO string + masking.
//
// 사용처:
// - app/actions/calculate.ts: 계산 결과를 클라이언트로 전달
// - app/api/report/route.ts: 클라이언트가 보낸 transactions(wire)를 서버 재계산용으로 복원,
//   재계산한 TaxResult를 PDF 렌더에 다시 wire로 변환

import type {
  ParsedTransaction,
  TaxResult,
  UnifiedTransaction,
} from './types';
import type {
  DeemedCostSourceWire,
  ParsedTransactionWire,
  TaxResultWire,
  UnifiedTransactionWire,
} from '@/app/actions/calculate.types';
import type { DeemedCostResolution } from './resolvers';

export function parsedToWire(tx: ParsedTransaction): ParsedTransactionWire {
  return { ...tx, date: tx.date.toISOString() };
}

export function parsedFromWire(w: ParsedTransactionWire): ParsedTransaction {
  return { ...w, date: new Date(w.date) };
}

export function unifiedToWire(tx: UnifiedTransaction): UnifiedTransactionWire {
  return { ...tx, date: tx.date.toISOString() };
}

export function unifiedFromWire(w: UnifiedTransactionWire): UnifiedTransaction {
  return { ...w, date: new Date(w.date) };
}

export function resultToWire(
  r: TaxResult,
  plan: 'free' | 'premium',
): TaxResultWire {
  return {
    ...r,
    realizedGains: r.realizedGains.map((g) => ({
      ...g,
      sellDate: g.sellDate.toISOString(),
      consumedLots: g.consumedLots.map((cl) => ({
        ...cl,
        buyDate: cl.buyDate ? cl.buyDate.toISOString() : undefined,
      })),
    })),
    holdingsAfter: Object.fromEntries(
      Object.entries(r.holdingsAfter).map(([k, lots]) => [
        k,
        lots.map((l) => ({ ...l, date: l.date.toISOString() })),
      ]),
    ),
    plan,
    masked: false,
  };
}

/**
 * audit reuse R#4: calculate.ts + /api/report/route.ts 가 같은 5-field
 * deemedCostSource wire 객체를 빌드. helper 로 추출해 drift 위험 차단.
 */
export function buildDeemedCostWire(
  deemedRes: DeemedCostResolution,
): DeemedCostSourceWire {
  return {
    realCoins: deemedRes.realCoins,
    estimateCoins: deemedRes.estimateCoins,
    userOverrideCoins: deemedRes.userOverrideCoins,
    missingCoins: deemedRes.missingCoins,
    deemedDate: deemedRes.deemedDate,
  };
}

export function maskForFree(wire: TaxResultWire): TaxResultWire {
  // P1-7: 무료 사용자의 PnL/세액 노출 차단. 단순 derived 값 (netPnLKRW, totalGain/Loss)
  // 뿐 아니라 lot-level (holdingsAfter.pricePerUnitKRW/totalCostKRW) 도 마스킹해야
  // pre/post snapshot 비교로 PnL 역산되는 우회 차단됨.
  // summary 의 buy/sell 도 함께 0 처리 — netPnL 도출 가능한 모든 경로 차단.
  return {
    ...wire,
    totalGainKRW: 0,
    totalLossKRW: 0,
    netPnLKRW: 0,
    taxableIncomeKRW: 0,
    taxAmountKRW: 0,
    incomeTaxKRW: 0,
    localTaxKRW: 0,
    realizedGains: [],
    holdingsAfter: {},
    summary: wire.summary.map((s) => ({
      ...s,
      totalBuyKRW: 0,
      totalSellKRW: 0,
      realizedPnLKRW: 0,
      totalFeeKRW: 0,
    })),
    summaryByExchange: wire.summaryByExchange.map((s) => ({
      ...s,
      totalBuyKRW: 0,
      totalSellKRW: 0,
      realizedPnLKRW: 0,
      totalFeeKRW: 0,
    })),
    masked: true,
  };
}
