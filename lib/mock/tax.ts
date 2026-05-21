'use client';

import { loadSession } from '@/lib/storage/session';
import type { Transaction } from './transactions';

export type TaxMethod = 'fifo' | 'avg';

export interface RateSourceClient {
  primary: string;
  fallbackUsed: boolean;
  lastFetchedAt: string | null;
  fallbackName: string;
}

export interface DeemedCostSourceClient {
  realCoins: string[];
  estimateCoins: string[];
  userOverrideCoins: string[];
  missingCoins: string[];
  deemedDate: string;
}

export interface ConsumedLotClient {
  lotId: string;
  amount: number;
  pricePerUnitKRW: number;
  costKRW: number;
  buyDate?: string; // FIFO에서만 채워짐. MA의 avg entry는 undefined.
  exchange?: string;
  isDeemedCost: boolean;
}

export interface RealizedGainClient {
  id: string;
  coin: string;
  sellDate: string;
  sellAmount: number;
  proceedsKRW: number;
  costBasisKRW: number;
  sellFeeKRW: number;
  buyFeeKRW: number;
  pnlKRW: number;
  exchange: string;
  consumedLots: ConsumedLotClient[];
}

export interface ExchangeCoinPnL {
  exchange: string;
  coin: string;
  buyKRW: number;
  sellKRW: number;
  gain: number;
  feeKRW: number;
  transactionCount: number;
}

// P1 #10: holdingsAfter — 신고 연도 종료 시점 잔여 보유 lots.
// 다음 연도 신고의 "시작점" (이월된 매수 lot).
export interface HoldingLotClient {
  id: string;
  amount: number;
  originalAmount: number;
  pricePerUnitKRW: number;
  totalCostKRW: number;
  date: string;
  exchange: string;
  isDeemedCost: boolean;
}

export interface HoldingsByCoinClient {
  coin: string;
  totalAmount: number;
  totalCostKRW: number;
  avgCostKRW: number;
  lots: HoldingLotClient[];
}

// v2 #1: 비교 카드용 client 타입.
export interface MethodComparisonClient {
  fifo: { netPnL: number; taxable: number; tax: number };
  ma: { netPnL: number; taxable: number; tax: number };
  selected: 'fifo' | 'ma';
}

export interface TaxResult {
  totalGain: number; // 양수 손익 합계 (순수 이익 합계)
  totalLoss: number; // 음수 손익 합계의 절댓값 (순수 손실 합계)
  netPnL: number; // 순손익 = totalGain - totalLoss (= taxable + deduction 전)
  deduction: number;
  taxable: number;
  tax: number;
  perCoin: Array<{ coin: string; gain: number; volume: number }>;
  perExchangeCoin: ExchangeCoinPnL[]; // P1 #9
  holdingsByCoin: HoldingsByCoinClient[]; // P1 #10
  realizedGains: RealizedGainClient[];
  transactionCount: number;
  plan: 'free' | 'premium';
  masked: boolean;
  rateSource: RateSourceClient | null;
  deemedCostSource: DeemedCostSourceClient | null;
  methodComparison: MethodComparisonClient | null; // v2 #1
}

const DEDUCTION_KRW = 2_500_000;

const EMPTY_RESULT: TaxResult = {
  totalGain: 0,
  totalLoss: 0,
  netPnL: 0,
  deduction: DEDUCTION_KRW,
  taxable: 0,
  tax: 0,
  perCoin: [],
  perExchangeCoin: [],
  holdingsByCoin: [],
  realizedGains: [],
  transactionCount: 0,
  plan: 'free',
  masked: false,
  rateSource: null,
  deemedCostSource: null,
  methodComparison: null,
};

export function calculateTax(
  _transactions: Transaction[],
  _method: TaxMethod,
  year?: number,
): TaxResult {
  const session = loadSession();
  if (!session?.result) return EMPTY_RESULT;
  if (year != null && session.year !== year) return EMPTY_RESULT;

  const r = session.result;
  return {
    totalGain: r.totalGainKRW,
    totalLoss: r.totalLossKRW,
    netPnL: r.netPnLKRW,
    deduction: r.deductionKRW,
    taxable: r.taxableIncomeKRW,
    tax: r.taxAmountKRW,
    perCoin: r.summary
      .map((s) => ({
        coin: s.coin,
        gain: s.realizedPnLKRW,
        volume: s.totalSellKRW,
      }))
      .sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain)),
    perExchangeCoin: (r.summaryByExchange ?? []).map((s) => ({
      exchange: s.exchange,
      coin: s.coin,
      buyKRW: s.totalBuyKRW,
      sellKRW: s.totalSellKRW,
      gain: s.realizedPnLKRW,
      feeKRW: s.totalFeeKRW,
      transactionCount: s.transactionCount,
    })),
    holdingsByCoin: Object.entries(r.holdingsAfter ?? {})
      .map(([coin, lots]) => {
        const filtered = lots.filter((l) => l.amount > 0);
        if (filtered.length === 0) return null;
        const totalAmount = filtered.reduce((s, l) => s + l.amount, 0);
        const totalCostKRW = filtered.reduce(
          (s, l) => s + l.amount * l.pricePerUnitKRW,
          0,
        );
        return {
          coin,
          totalAmount,
          totalCostKRW,
          avgCostKRW: totalAmount > 0 ? totalCostKRW / totalAmount : 0,
          lots: filtered.map((l) => ({
            id: l.id,
            amount: l.amount,
            originalAmount: l.originalAmount,
            pricePerUnitKRW: l.pricePerUnitKRW,
            totalCostKRW: l.amount * l.pricePerUnitKRW,
            date: l.date,
            exchange: l.exchange,
            isDeemedCost: l.isDeemedCost,
          })),
        };
      })
      .filter((h): h is HoldingsByCoinClient => h !== null)
      .sort((a, b) => b.totalCostKRW - a.totalCostKRW),
    realizedGains: r.realizedGains
      .map((g) => ({
        id: g.id,
        coin: g.coin,
        sellDate: g.sellDate,
        sellAmount: g.sellAmount,
        proceedsKRW: g.proceedsKRW,
        costBasisKRW: g.costBasisKRW,
        sellFeeKRW: g.sellFeeKRW,
        buyFeeKRW: g.buyFeeKRW,
        pnlKRW: g.pnlKRW,
        exchange: g.exchange,
        consumedLots: g.consumedLots,
      }))
      .sort((a, b) => b.sellDate.localeCompare(a.sellDate)),
    transactionCount: r.summary.reduce(
      (s, c) => s + c.transactionCount,
      0,
    ),
    plan: r.plan ?? 'free',
    masked: r.masked ?? false,
    rateSource: r.rateSource ?? null,
    deemedCostSource: r.deemedCostSource ?? null,
    methodComparison: r.methodComparison
      ? {
          fifo: {
            netPnL: r.methodComparison.fifo.netPnLKRW,
            taxable: r.methodComparison.fifo.taxableIncomeKRW,
            tax: r.methodComparison.fifo.taxAmountKRW,
          },
          ma: {
            netPnL: r.methodComparison.ma.netPnLKRW,
            taxable: r.methodComparison.ma.taxableIncomeKRW,
            tax: r.methodComparison.ma.taxAmountKRW,
          },
          selected: r.methodComparison.selected,
        }
      : null,
  };
}

// v2 #2: MA 평균 단가 timeline.
// 진짜 MA 알고리즘: 매수 시 (totalCost, totalAmount) 누적, 매도 시 비율로 차감
// (평균 자체는 유지). 평균이 변하는 시점(매수)에만 point 생성.
export interface MATimelinePoint {
  date: string; // ISO 8601
  avgPriceKRW: number;
  totalAmount: number; // 누적 보유량
}

export interface MATimelineCoin {
  coin: string;
  points: MATimelinePoint[];
  finalAmount: number;
  finalAvgPriceKRW: number;
  totalCostKRW: number; // 정렬·중요도 점수용
}

export function calculateMATimeline(): MATimelineCoin[] {
  const session = loadSession();
  if (!session?.allUnified) return [];

  // 코인별로 시간순 거래 모음 (BUY/SELL 모두 필요 — SELL이 누적량 차감)
  const byCoin = new Map<
    string,
    Array<{ date: string; type: 'BUY' | 'SELL'; amount: number; totalKRW: number }>
  >();
  for (const tx of session.allUnified) {
    if (tx.type === 'SWAP') continue; // SWAP은 split된 BUY/SELL로 이미 표현됨
    const list = byCoin.get(tx.coin) ?? [];
    list.push({
      date: tx.date,
      type: tx.type,
      amount: tx.amount,
      totalKRW: tx.totalKRW,
    });
    byCoin.set(tx.coin, list);
  }

  const result: MATimelineCoin[] = [];
  for (const [coin, txs] of byCoin) {
    txs.sort((a, b) => a.date.localeCompare(b.date));
    let totalAmount = 0;
    let totalCost = 0;
    const points: MATimelinePoint[] = [];

    for (const tx of txs) {
      if (tx.type === 'BUY') {
        totalAmount += tx.amount;
        totalCost += tx.totalKRW;
        if (totalAmount > 0) {
          points.push({
            date: tx.date,
            avgPriceKRW: totalCost / totalAmount,
            totalAmount,
          });
        }
      } else {
        // SELL: 보유량 비율로 cost 차감, 평균 단가는 유지.
        if (totalAmount > 0) {
          const sellAmount = Math.min(tx.amount, totalAmount);
          const ratio = sellAmount / totalAmount;
          totalCost -= totalCost * ratio;
          totalAmount -= sellAmount;
        }
      }
    }

    if (points.length === 0) continue;
    const last = points[points.length - 1];
    result.push({
      coin,
      points,
      finalAmount: totalAmount,
      finalAvgPriceKRW: totalAmount > 0 ? totalCost / totalAmount : last.avgPriceKRW,
      totalCostKRW: points.reduce((s, p) => s + p.avgPriceKRW * p.totalAmount, 0),
    });
  }

  // 누적 cost 큰 순으로 정렬 (timeline에서 비중 큰 코인이 위로)
  result.sort((a, b) => b.totalCostKRW - a.totalCostKRW);
  return result;
}

const METHOD_KEY = 'kontaxt-method';

export function getTaxMethod(): TaxMethod {
  if (typeof window === 'undefined') return 'fifo';
  const v = localStorage.getItem(METHOD_KEY);
  return v === 'avg' ? 'avg' : 'fifo';
}

export function setTaxMethod(m: TaxMethod) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(METHOD_KEY, m);
}

export function formatKrw(n: number): string {
  const sign = n < 0 ? '−' : n > 0 ? '+' : '';
  const abs = Math.abs(n);
  if (abs >= 100_000_000) {
    return `${sign}₩${(abs / 100_000_000).toFixed(2)}억`;
  }
  if (abs >= 10_000) {
    return `${sign}₩${Math.round(abs / 10_000).toLocaleString()}만`;
  }
  return `${sign}₩${abs.toLocaleString()}`;
}
