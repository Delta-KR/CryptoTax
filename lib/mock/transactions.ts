'use client';

import { loadSession, clearSession } from '@/lib/storage/session';
import type { UnifiedTransactionWire } from '@/app/actions/calculate.types';

export type ExchangeId = 'upbit' | 'binance' | 'bybit';

export interface RateMetaClient {
  rateKRW: number;
  sourceDate: string;
  source: 'db' | 'static';
  sourceName: string;
}

export interface Transaction {
  id: string;
  date: string;
  exchange: ExchangeId;
  type: 'buy' | 'sell';
  coin: string;
  amount: number;
  pricePerCoin: number;
  total: number;
  fee: number;
  originalCurrency: string;
  rateMeta?: RateMetaClient;
}

export interface TransactionFilters {
  year?: number;
  exchange?: ExchangeId | 'all';
  coin?: string;
  type?: 'all' | 'buy' | 'sell';
  search?: string;
}

function toExchangeId(name: string): ExchangeId {
  const lower = name.toLowerCase();
  if (lower === 'upbit') return 'upbit';
  if (lower === 'binance') return 'binance';
  if (lower === 'bybit') return 'bybit';
  return 'upbit';
}

function toTransaction(w: UnifiedTransactionWire): Transaction | null {
  if (w.type === 'SWAP') return null;
  return {
    id: w.id,
    date: w.date,
    exchange: toExchangeId(w.exchange),
    type: w.type === 'BUY' ? 'buy' : 'sell',
    coin: w.coin,
    amount: w.amount,
    pricePerCoin: w.pricePerUnitKRW,
    total: w.totalKRW,
    fee: w.feeKRW,
    originalCurrency: w.originalCurrency,
    rateMeta: w.rateMeta,
  };
}

export function getTransactions(
  filters: TransactionFilters = {},
): Transaction[] {
  const session = loadSession();
  const all = (session?.allUnified ?? [])
    .map(toTransaction)
    .filter((t): t is Transaction => t !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  return all.filter((t) => {
    if (filters.year != null) {
      const y = new Date(t.date).getFullYear();
      if (y !== filters.year) return false;
    }
    if (
      filters.exchange &&
      filters.exchange !== 'all' &&
      t.exchange !== filters.exchange
    )
      return false;
    if (filters.coin && filters.coin !== 'all' && t.coin !== filters.coin)
      return false;
    if (filters.type && filters.type !== 'all' && t.type !== filters.type)
      return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${t.coin} ${t.exchange} ${t.type}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function clearExtra(): void {
  clearSession();
}

export function addBatch(_exchange: ExchangeId, _count: number): Transaction[] {
  return [];
}

export const exchangeLabel: Record<ExchangeId, string> = {
  upbit: '업비트',
  binance: '바이낸스',
  bybit: '바이빗',
};
