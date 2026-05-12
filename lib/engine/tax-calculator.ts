import { v4 as uuid } from 'uuid';
import type {
  CoinSummary,
  Lot,
  RealizedGain,
  TaxResult,
  UnifiedTransaction,
} from './types';
import { FIFOEngine } from './fifo';
import { applyDeemedCost } from './deemed-cost';
import { TAX_CONSTANTS, roundKRW } from './constants';

const KST_OFFSET_MS = 9 * 3600 * 1000;

export function kstYear(d: Date): number {
  return new Date(d.getTime() + KST_OFFSET_MS).getUTCFullYear();
}

export interface TaxCalculatorInput {
  transactions: UnifiedTransaction[];
  year: number;
  deemedCostPrices?: Map<string, number>;
}

function makeLot(
  tx: UnifiedTransaction,
  snapshots: Map<string, number> | undefined,
): Lot {
  const { pricePerUnitKRW, isDeemedCost } = applyDeemedCost(tx, snapshots);
  return {
    id: uuid(),
    coin: tx.coin,
    amount: tx.amount,
    originalAmount: tx.amount,
    pricePerUnitKRW,
    totalCostKRW: roundKRW(pricePerUnitKRW * tx.amount),
    feeKRW: tx.feeKRW,
    date: tx.date,
    exchange: tx.exchange,
    isDeemedCost,
  };
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
  const fifo = new FIFOEngine();
  const realizedGains: RealizedGain[] = [];

  for (const tx of input.transactions) {
    if (tx.type === 'BUY') {
      fifo.addLot(tx.coin, makeLot(tx, input.deemedCostPrices));
    } else if (tx.type === 'SELL') {
      const { costBasisKRW, consumedLots, buyFeeKRW } = fifo.consumeLots(
        tx.coin,
        tx.amount,
      );
      const pnl = roundKRW(
        tx.totalKRW - costBasisKRW - tx.feeKRW - buyFeeKRW,
      );

      if (kstYear(tx.date) === input.year) {
        realizedGains.push({
          id: uuid(),
          coin: tx.coin,
          sellDate: tx.date,
          sellAmount: tx.amount,
          proceedsKRW: tx.totalKRW,
          costBasisKRW,
          sellFeeKRW: tx.feeKRW,
          buyFeeKRW,
          pnlKRW: pnl,
          exchange: tx.exchange,
          consumedLots,
        });
      }
    }
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
    holdingsAfter: Object.fromEntries(fifo.getHoldings()),
    summary: buildSummary(realizedGains, input.transactions, input.year),
  };
}
