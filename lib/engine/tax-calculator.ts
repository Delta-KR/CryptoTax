import { v4 as uuid } from 'uuid';
import type {
  CoinSummary,
  ConsumedLot,
  ExchangeCoinSummary,
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

// P1 #9: 거래소 × 코인 매트릭스. summary와 동일한 합계 로직이지만 key가 `${exchange}|${coin}`.
// realizedPnLKRW는 RealizedGain.exchange(=매도 거래소) 기준. 매수만 일어난 코인-거래소는 PnL=0.
function buildSummaryByExchange(
  gains: RealizedGain[],
  txs: UnifiedTransaction[],
  year: number,
): ExchangeCoinSummary[] {
  const map = new Map<string, ExchangeCoinSummary>();
  const keyOf = (exchange: string, coin: string) => `${exchange}|${coin}`;

  for (const tx of txs) {
    if (kstYear(tx.date) !== year) continue;
    const key = keyOf(tx.exchange, tx.coin);
    const s = map.get(key) ?? {
      exchange: tx.exchange,
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
    map.set(key, s);
  }
  for (const g of gains) {
    const key = keyOf(g.exchange, g.coin);
    const s = map.get(key);
    if (s) s.realizedPnLKRW += g.pnlKRW;
  }
  return Array.from(map.values()).sort((a, b) => {
    const e = a.exchange.localeCompare(b.exchange);
    return e !== 0 ? e : a.coin.localeCompare(b.coin);
  });
}

// 매도된 코인의 매수 기록이 없는 경우(orphan) 모은 진단 정보. 안내 메시지에 활용.
interface OrphanInfo {
  count: number;
  exchanges: Set<string>;
  firstDate: Date;
  lastDate: Date;
  totalAmount: number;
}

function formatOrphanDate(d: Date): string {
  // KST 기준 YYYY-MM-DD
  const kst = new Date(d.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

function formatOrphanAmount(n: number): string {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: 8 });
}

function buildOrphanWarning(coin: string, info: OrphanInfo): string {
  const exchanges = Array.from(info.exchanges).sort();
  const exchangeStr =
    exchanges.length === 1 ? exchanges[0] : exchanges.join(', ');
  const firstStr = formatOrphanDate(info.firstDate);
  const lastStr = formatOrphanDate(info.lastDate);
  const rangeStr = firstStr === lastStr ? firstStr : `${firstStr} ~ ${lastStr}`;
  const amountStr = formatOrphanAmount(info.totalAmount);

  // 한 거래소면 "그 거래소의 다른 기간"이라 콕 짚어줄 수 있고, 여러 거래소면 일반 안내.
  const actionHint =
    exchanges.length === 1
      ? `${exchanges[0]}의 다른 기간 거래내역을 추가 업로드하거나, 외부에서 받은 코인이면 의제취득가액 적용 대상인지 확인해주세요.`
      : `각 거래소(${exchangeStr})의 매수 거래내역을 추가 업로드하거나, 외부에서 받은 코인이면 의제취득가액 적용 대상인지 확인해주세요.`;

  return `${coin} 매도 ${info.count}건의 매수 기록이 없습니다 (${exchangeStr} · ${rangeStr}, 총 ${amountStr} ${coin}) — 손익 0원으로 처리. ${actionHint}`;
}

export function calculateTax(input: TaxCalculatorInput): TaxResult {
  const method: TaxMethod = input.method ?? 'fifo';
  const engine: TaxEngine = method === 'avg' ? new MAEngine() : new FIFOEngine();
  const realizedGains: RealizedGain[] = [];
  const warnings: string[] = [];
  const orphans = new Map<string, OrphanInfo>();

  for (const tx of input.transactions) {
    if (tx.type === 'BUY') {
      engine.addLot(tx.coin, makeLot(tx, input.deemedCostPrices, warnings));
    } else if (tx.type === 'SELL') {
      const outcome = consumeWithFallback(engine, tx);
      const pnl = roundKRW(
        tx.totalKRW - outcome.costBasisKRW - tx.feeKRW - outcome.buyFeeKRW,
      );

      if (outcome.orphan) {
        const info = orphans.get(tx.coin);
        if (info) {
          info.count += 1;
          info.exchanges.add(tx.exchange);
          if (tx.date.getTime() < info.firstDate.getTime()) {
            info.firstDate = tx.date;
          }
          if (tx.date.getTime() > info.lastDate.getTime()) {
            info.lastDate = tx.date;
          }
          info.totalAmount += tx.amount;
        } else {
          orphans.set(tx.coin, {
            count: 1,
            exchanges: new Set([tx.exchange]),
            firstDate: tx.date,
            lastDate: tx.date,
            totalAmount: tx.amount,
          });
        }
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

  for (const [coin, info] of orphans) {
    warnings.push(buildOrphanWarning(coin, info));
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
    summaryByExchange: buildSummaryByExchange(
      realizedGains,
      input.transactions,
      input.year,
    ),
    warnings,
  };
}
