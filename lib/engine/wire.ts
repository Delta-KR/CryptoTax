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
  ParsedTransactionWire,
  TaxResultWire,
  UnifiedTransactionWire,
} from '@/app/actions/calculate.types';

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

export function maskForFree(wire: TaxResultWire): TaxResultWire {
  return {
    ...wire,
    taxableIncomeKRW: 0,
    taxAmountKRW: 0,
    incomeTaxKRW: 0,
    localTaxKRW: 0,
    realizedGains: [],
    summary: wire.summary.map((s) => ({ ...s, realizedPnLKRW: 0 })),
    summaryByExchange: wire.summaryByExchange.map((s) => ({
      ...s,
      realizedPnLKRW: 0,
    })),
    masked: true,
  };
}
