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
  };
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
