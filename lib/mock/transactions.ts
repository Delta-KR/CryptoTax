// Mock 거래 데이터 — 결정적 PRNG로 생성하므로 SSR/클라이언트 일관.
// 업로드 시 추가되는 거래는 localStorage에 별도 저장.

export type ExchangeId = 'upbit' | 'bithumb' | 'binance' | 'bybit';

export interface Transaction {
  id: string;
  date: string; // ISO
  exchange: ExchangeId;
  type: 'buy' | 'sell';
  coin: string;
  amount: number;
  pricePerCoin: number; // KRW
  total: number; // KRW (amount * pricePerCoin)
  fee: number;
}

const EXTRA_KEY = 'crypto-tax-tx-extra';

const exchanges: ExchangeId[] = ['upbit', 'bithumb', 'binance'];
const coinPrices: Record<string, number> = {
  BTC: 85_000_000,
  ETH: 4_800_000,
  SOL: 280_000,
  XRP: 800,
  DOGE: 400,
};
const coins = Object.keys(coinPrices);

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function gen(count: number, idOffset = 0): Transaction[] {
  const txs: Transaction[] = [];
  for (let i = 1; i <= count; i++) {
    const s = i + idOffset;
    const ex = exchanges[Math.floor(rand(s * 7) * exchanges.length)];
    const coin = coins[Math.floor(rand(s * 11) * coins.length)];
    const basePrice = coinPrices[coin];
    const year = rand(s * 13) > 0.5 ? 2027 : 2026;
    const month = Math.floor(rand(s * 17) * 12);
    const day = Math.floor(rand(s * 19) * 27) + 1;
    const hour = Math.floor(rand(s * 21) * 24);
    const minute = Math.floor(rand(s * 23) * 60);
    const date = new Date(year, month, day, hour, minute);
    const type: 'buy' | 'sell' = rand(s * 29) > 0.5 ? 'sell' : 'buy';
    const amount = parseFloat(
      (
        coin === 'BTC'
          ? 0.005 + rand(s * 31) * 0.05
          : coin === 'ETH'
            ? 0.1 + rand(s * 31) * 0.8
            : coin === 'SOL'
              ? 2 + rand(s * 31) * 20
              : coin === 'XRP'
                ? 100 + rand(s * 31) * 900
                : 200 + rand(s * 31) * 1800
      ).toFixed(4)
    );
    const pricePerCoin = Math.round(basePrice * (0.85 + rand(s * 37) * 0.3));
    const total = Math.round(amount * pricePerCoin);
    const fee = Math.round(total * 0.0005);
    txs.push({
      id: `tx_${s}`,
      date: date.toISOString(),
      exchange: ex,
      type,
      coin,
      amount,
      pricePerCoin,
      total,
      fee,
    });
  }
  return txs;
}

const baseTransactions: Transaction[] = gen(40);

function readExtra(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EXTRA_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

function writeExtra(txs: Transaction[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXTRA_KEY, JSON.stringify(txs));
}

export interface TransactionFilters {
  year?: number;
  exchange?: ExchangeId | 'all';
  coin?: string;
  type?: 'all' | 'buy' | 'sell';
  search?: string;
}

export function getTransactions(filters: TransactionFilters = {}): Transaction[] {
  const all = [...baseTransactions, ...readExtra()].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  return all.filter((t) => {
    if (filters.year != null) {
      const y = new Date(t.date).getFullYear();
      if (y !== filters.year) return false;
    }
    if (filters.exchange && filters.exchange !== 'all' && t.exchange !== filters.exchange) return false;
    if (filters.coin && filters.coin !== 'all' && t.coin !== filters.coin) return false;
    if (filters.type && filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${t.coin} ${t.exchange} ${t.type}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// 업로드 시뮬레이션 — 거래소 + 개수 → 결정적 mock batch 추가
export function addBatch(exchange: ExchangeId, count: number): Transaction[] {
  const existing = readExtra();
  const seed = baseTransactions.length + existing.length + 1;
  const batch = gen(count, seed).map((t) => ({ ...t, exchange }));
  writeExtra([...existing, ...batch]);
  return batch;
}

export function clearExtra() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(EXTRA_KEY);
}

// 거래소 표시명
export const exchangeLabel: Record<ExchangeId, string> = {
  upbit: '업비트',
  bithumb: '빗썸',
  binance: '바이낸스',
  bybit: '바이빗',
};
