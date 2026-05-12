import type { Currency } from './types';

export interface ExchangeRateProvider {
  getRate(date: Date, from: Currency, to: Currency): Promise<number>;
}

const MS_PER_DAY = 24 * 3600 * 1000;
const KST_OFFSET_MS = 9 * 3600 * 1000;

export function toKSTDateStr(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

export type StaticRateEntry = readonly [string, Currency, Currency, number];

export class StaticExchangeRateProvider implements ExchangeRateProvider {
  private readonly rates: Map<string, number>;
  private readonly fallbackDays: number;

  constructor(rates: Iterable<StaticRateEntry>, fallbackDays = 7) {
    this.rates = new Map();
    for (const [date, from, to, rate] of rates) {
      this.rates.set(StaticExchangeRateProvider.key(date, from, to), rate);
    }
    this.fallbackDays = fallbackDays;
  }

  private static key(date: string, from: string, to: string): string {
    return `${date}|${from}|${to}`;
  }

  async getRate(date: Date, from: Currency, to: Currency): Promise<number> {
    if (from === to) return 1;

    for (let i = 0; i <= this.fallbackDays; i++) {
      const d = new Date(date.getTime() - i * MS_PER_DAY);
      const r = this.rates.get(
        StaticExchangeRateProvider.key(toKSTDateStr(d), from, to),
      );
      if (r !== undefined) return r;
    }

    throw new Error(
      `환율 데이터 누락: ${from}→${to}, 기준일 ${toKSTDateStr(date)} 부근 ${this.fallbackDays + 1}일 내 데이터 없음`,
    );
  }
}
