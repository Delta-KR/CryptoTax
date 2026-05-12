'use client';

import { loadSession } from '@/lib/storage/session';
import type { Transaction } from './transactions';

export type TaxMethod = 'fifo' | 'avg';

export interface TaxResult {
  totalGain: number;
  deduction: number;
  taxable: number;
  tax: number;
  perCoin: Array<{ coin: string; gain: number; volume: number }>;
  transactionCount: number;
}

const DEDUCTION_KRW = 2_500_000;

const EMPTY_RESULT: TaxResult = {
  totalGain: 0,
  deduction: DEDUCTION_KRW,
  taxable: 0,
  tax: 0,
  perCoin: [],
  transactionCount: 0,
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
    totalGain: r.netPnLKRW,
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
    transactionCount: r.summary.reduce(
      (s, c) => s + c.transactionCount,
      0,
    ),
  };
}

const METHOD_KEY = 'crypto-tax-method';

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
