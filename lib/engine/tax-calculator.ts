import { v4 as uuid } from 'uuid';
import type {
  CoinSummary,
  ConsumedLot,
  Lot,
  RealizedGain,
  TaxResult,
  UnifiedTransaction,
} from './types';
import { FIFOEngine } from './fifo';
import { MAEngine } from './moving-average';
import type { TaxEngine } from './tax-engine';
import { applyDeemedCost } from './deemed-cost';
import { TAX_CONSTANTS, roundKRW } from './constants';

export type TaxMethod = 'fifo' | 'avg';

const KST_OFFSET_MS = 9 * 3600 * 1000;

export function kstYear(d: Date): number {
  return new Date(d.getTime() + KST_OFFSET_MS).getUTCFullYear();
}

export interface TaxCalculatorInput {
  transactions: UnifiedTransaction[];
  year: number;
  deemedCostPrices?: Map<string, number>;
  method?: TaxMethod;
}

interface ConsumeOutcome {
  costBasisKRW: number;
  consumedLots: ConsumedLot[];
  buyFeeKRW: number;
  orphan: boolean;
}

function makeLot(
  tx: UnifiedTransaction,
  snapshots: Map<string, number> | undefined,
  warnings: string[],
): Lot {
  const r = applyDeemedCost(tx, snapshots);
  if (r.warning) warnings.push(r.warning);
  return {
    id: uuid(),
    coin: tx.coin,
    amount: tx.amount,
    originalAmount: tx.amount,
    pricePerUnitKRW: r.pricePerUnitKRW,
    totalCostKRW: roundKRW(r.pricePerUnitKRW * tx.amount),
    feeKRW: tx.feeKRW,
    date: tx.date,
    exchange: tx.exchange,
    isDeemedCost: r.isDeemedCost,
  };
}

function consumeWithFallback(
  engine: TaxEngine,
  tx: UnifiedTransaction,
): ConsumeOutcome {
  try {
    const r = engine.consumeLots(tx.coin, tx.amount);
    return { ...r, orphan: false };
  } catch {
    return {
      costBasisKRW: tx.totalKRW,
      consumedLots: [],
      buyFeeKRW: 0,
      orphan: true,
    };
  }
}

function buildSummary(
  gains: RealizedGain[],
  txs: UnifiedTransaction[],
  year: number,
): CoinSummary[] {
  const map = new Map<string, CoinSummary>();
  for (const tx of txs) {
    if (kstYear(tx.date) !== year) continue;
    const s = map.get(tx.coin) ?? {
      coin: tx.coin,
      totalBuyKRW: 0,
      totalSellKRW: 0,
      realizedPnLKRW: 0,
      totalFeeKRW: 0,
      transactionCount: 0,
    };
    if (tx.type === 'BUY') s.totalBuyKRW += tx.totalKRW;
    if (tx.type === 'SELL') s.totalSellKRW += tx.totalKRW;
    s.totalFeeKRW += tx.feeKRW;
    s.transactionCount += 1;
    map.set(tx.coin, s);
  }
  for (const g of gains) {
    const s = map.get(g.coin);
    if (s) s.realizedPnLKRW += g.pnlKRW;
  }
  return Array.from(map.values()).sort((a, b) =>
    a.coin.localeCompare(b.coin),
  );
}

export function calculateTax(input: TaxCalculatorInput): TaxResult {
  const method: TaxMethod = input.method ?? 'fifo';
  const engine: TaxEngine = method === 'avg' ? new MAEngine() : new FIFOEngine();
  const realizedGains: RealizedGain[] = [];
  const warnings: string[] = [];
  const orphanCounts = new Map<string, number>();

  for (const tx of input.transactions) {
    if (tx.type === 'BUY') {
      engine.addLot(tx.coin, makeLot(tx, input.deemedCostPrices, warnings));
    } else if (tx.type === 'SELL') {
      const outcome = consumeWithFallback(engine, tx);
      const pnl = roundKRW(
        tx.totalKRW - outcome.costBasisKRW - tx.feeKRW - outcome.buyFeeKRW,
      );

      if (outcome.orphan) {
        orphanCounts.set(
          tx.coin,
          (orphanCounts.get(tx.coin) ?? 0) + 1,
        );
      }

      if (kstYear(tx.date) === input.year) {
        realizedGains.push({
          id: uuid(),
          coin: tx.coin,
          sellDate: tx.date,
          sellAmount: tx.amount,
          proceedsKRW: tx.totalKRW,
          costBasisKRW: outcome.costBasisKRW,
          sellFeeKRW: tx.feeKRW,
          buyFeeKRW: outcome.buyFeeKRW,
          pnlKRW: pnl,
          exchange: tx.exchange,
          consumedLots: outcome.consumedLots,
        });
      }
    }
  }

  for (const [coin, count] of orphanCounts) {
    warnings.push(
      `${coin} 매도 ${count}건의 매수 기록이 없습니다 — 손익 0원으로 처리. 매수 거래소의 거래내역도 함께 업로드하면 정확한 세금이 계산됩니다.`,
    );
  }

  let totalGain = 0;
  let totalLoss = 0;
  for (const g of realizedGains) {
    if (g.pnlKRW > 0) totalGain += g.pnlKRW;
    else totalLoss += g.pnlKRW;
  }
  const netPnL = totalGain + totalLoss;
  const taxable = Math.max(0, netPnL - TAX_CONSTANTS.DEDUCTION_KRW);
  const incomeTax = roundKRW(taxable * TAX_CONSTANTS.INCOME_TAX_RATE);
  const localTax = roundKRW(taxable * TAX_CONSTANTS.LOCAL_TAX_RATE);

  return {
    year: input.year,
    totalGainKRW: roundKRW(totalGain),
    totalLossKRW: roundKRW(Math.abs(totalLoss)),
    netPnLKRW: roundKRW(netPnL),
    deductionKRW: TAX_CONSTANTS.DEDUCTION_KRW,
    taxableIncomeKRW: taxable,
    taxAmountKRW: incomeTax + localTax,
    incomeTaxKRW: incomeTax,
    localTaxKRW: localTax,
    realizedGains,
    holdingsAfter: Object.fromEntries(engine.getHoldings()),
    summary: buildSummary(realizedGains, input.transactions, input.year),
    warnings,
  };
}
