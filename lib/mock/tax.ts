// FIFO / 이동평균(MA) 양도소득 계산. 거래 데이터를 받아 derive.
import type { Transaction } from './transactions';

export type TaxMethod = 'fifo' | 'avg';

export interface TaxResult {
  totalGain: number; // 총 양도차익 (KRW)
  deduction: number; // 기본공제 (250만원 고정)
  taxable: number; // 과세표준 (max(0, totalGain - deduction))
  tax: number; // 납부세액 (taxable * 0.22)
  perCoin: Array<{ coin: string; gain: number; volume: number }>; // 코인별
  transactionCount: number;
}

const DEDUCTION_KRW = 2_500_000; // 250만원
const RATE = 0.22; // 소득세 20% + 지방세 2%

interface Lot {
  amount: number;
  costPerCoin: number;
}

function calculateFifo(txs: Transaction[]): Map<string, { gain: number; volume: number }> {
  const result = new Map<string, { gain: number; volume: number }>();
  // group by coin, sorted by date ascending
  const byCoin = new Map<string, Transaction[]>();
  for (const tx of [...txs].sort((a, b) => a.date.localeCompare(b.date))) {
    const list = byCoin.get(tx.coin) ?? [];
    list.push(tx);
    byCoin.set(tx.coin, list);
  }
  for (const [coin, list] of byCoin) {
    const queue: Lot[] = [];
    let gain = 0;
    let volume = 0;
    for (const tx of list) {
      if (tx.type === 'buy') {
        queue.push({ amount: tx.amount, costPerCoin: tx.pricePerCoin });
      } else {
        let remaining = tx.amount;
        volume += tx.total;
        while (remaining > 0 && queue.length > 0) {
          const lot = queue[0];
          const take = Math.min(remaining, lot.amount);
          gain += take * (tx.pricePerCoin - lot.costPerCoin);
          lot.amount -= take;
          remaining -= take;
          if (lot.amount <= 1e-9) queue.shift();
        }
        // 매도가 매수 history 없이 발생한 경우 (실제 시나리오에선 의제취득가액 적용)
        // 여기선 mock이므로 매도 가격을 매수 가격으로 가정 (gain += 0)
      }
    }
    result.set(coin, { gain: Math.round(gain - 0), volume });
  }
  return result;
}

function calculateAvg(txs: Transaction[]): Map<string, { gain: number; volume: number }> {
  const result = new Map<string, { gain: number; volume: number }>();
  const byCoin = new Map<string, Transaction[]>();
  for (const tx of [...txs].sort((a, b) => a.date.localeCompare(b.date))) {
    const list = byCoin.get(tx.coin) ?? [];
    list.push(tx);
    byCoin.set(tx.coin, list);
  }
  for (const [coin, list] of byCoin) {
    let runningAmount = 0;
    let runningCost = 0; // sum of (amount * pricePerCoin) — for buys
    let gain = 0;
    let volume = 0;
    for (const tx of list) {
      if (tx.type === 'buy') {
        runningCost += tx.amount * tx.pricePerCoin;
        runningAmount += tx.amount;
      } else {
        const avgCost = runningAmount > 0 ? runningCost / runningAmount : tx.pricePerCoin;
        gain += tx.amount * (tx.pricePerCoin - avgCost);
        volume += tx.total;
        // reduce running by sold amount (cost basis remains average)
        runningAmount -= tx.amount;
        if (runningAmount < 0) runningAmount = 0;
        runningCost = runningAmount * avgCost;
      }
    }
    result.set(coin, { gain: Math.round(gain), volume });
  }
  return result;
}

export function calculateTax(
  transactions: Transaction[],
  method: TaxMethod,
  year?: number
): TaxResult {
  // 양도소득은 신고연도(year) 기준이지만, 매수내역은 그 이전 연도 포함해야 함.
  // mock에선 매도 거래가 year에 속한 것만 양도소득으로 카운트하지만
  // FIFO/AVG의 cost basis는 전체 매수 이력 사용.
  const txsForBasis = transactions;
  const txsForGain =
    year != null
      ? transactions.filter((t) => new Date(t.date).getFullYear() === year)
      : transactions;
  // 단순화: cost basis와 gain 모두 동일 set 사용 (mock 데모 목적)
  const set = year != null ? txsForGain : txsForBasis;
  const perCoinMap =
    method === 'fifo' ? calculateFifo(set) : calculateAvg(set);
  const perCoin = [...perCoinMap.entries()]
    .map(([coin, { gain, volume }]) => ({ coin, gain, volume }))
    .sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain));
  const totalGain = perCoin.reduce((s, c) => s + c.gain, 0);
  const taxable = Math.max(0, totalGain - DEDUCTION_KRW);
  const tax = Math.round(taxable * RATE);
  return {
    totalGain,
    deduction: DEDUCTION_KRW,
    taxable,
    tax,
    perCoin,
    transactionCount: set.length,
  };
}

// localStorage 영속 계산 방식 설정
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

// 한국어 KRW 포맷
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
