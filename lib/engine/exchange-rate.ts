import type { Currency } from './types';

// 환율 해석 결과 — P1 #8 audit trail용. 거래별로 어느 출처/어느 날짜의 환율이 적용됐는지.
export interface RateResolution {
  rate: number;
  // 실제 데이터 날짜 (fallback 시 거래일과 다를 수 있음). YYYY-MM-DD KST.
  sourceDate: string;
  // 'db': Supabase daily_rates 테이블, 'static': 코드 내 분기별 fallback
  source: 'db' | 'static';
  // 'db'이면 row.source (예: 'Upbit'), 'static'이면 fallback 출처명
  sourceName: string;
}

export interface ExchangeRateProvider {
  // 후방 호환 — 단순 환율값만 필요한 경우.
  getRate(date: Date, from: Currency, to: Currency): Promise<number>;
  // P1 #8: 환율 + 출처 메타.
  getRateWithMeta(
    date: Date,
    from: Currency,
    to: Currency,
  ): Promise<RateResolution>;
}

const MS_PER_DAY = 24 * 3600 * 1000;
const KST_OFFSET_MS = 9 * 3600 * 1000;

export function toKSTDateStr(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

// KST 기준 연도/월/일 — 클라이언트/서버 UTC 환경 모두에서 일관된 결과.
// new Date(iso).getFullYear() 를 그대로 쓰면 UTC 환경에서 KST 새해 거래가 누락됨 (P1-2).
// 핫패스 (10k tx filter) 에서 호출되므로 ISO 문자열 할당 없이 getUTC* 만으로 계산.
export function kstYearOf(date: Date): number {
  return new Date(date.getTime() + KST_OFFSET_MS).getUTCFullYear();
}

export function kstMonthOf(date: Date): number {
  // 1~12
  return new Date(date.getTime() + KST_OFFSET_MS).getUTCMonth() + 1;
}

export function kstDayOf(date: Date): number {
  return new Date(date.getTime() + KST_OFFSET_MS).getUTCDate();
}

export type StaticRateEntry = readonly [string, Currency, Currency, number];

export class StaticExchangeRateProvider implements ExchangeRateProvider {
  private readonly rates: Map<string, number>;
  private readonly fallbackDays: number;
  private readonly sourceName: string;

  constructor(
    rates: Iterable<StaticRateEntry>,
    fallbackDays = 7,
    sourceName = 'Static fallback',
  ) {
    this.rates = new Map();
    for (const [date, from, to, rate] of rates) {
      this.rates.set(StaticExchangeRateProvider.key(date, from, to), rate);
    }
    this.fallbackDays = fallbackDays;
    this.sourceName = sourceName;
  }

  private static key(date: string, from: string, to: string): string {
    return `${date}|${from}|${to}`;
  }

  async getRate(date: Date, from: Currency, to: Currency): Promise<number> {
    return (await this.getRateWithMeta(date, from, to)).rate;
  }

  async getRateWithMeta(
    date: Date,
    from: Currency,
    to: Currency,
  ): Promise<RateResolution> {
    if (from === to) {
      return {
        rate: 1,
        sourceDate: toKSTDateStr(date),
        source: 'static',
        sourceName: 'Identity (KRW)',
      };
    }

    for (let i = 0; i <= this.fallbackDays; i++) {
      const d = new Date(date.getTime() - i * MS_PER_DAY);
      const sourceDate = toKSTDateStr(d);
      const r = this.rates.get(
        StaticExchangeRateProvider.key(sourceDate, from, to),
      );
      if (r !== undefined) {
        return {
          rate: r,
          sourceDate,
          source: 'static',
          sourceName: this.sourceName,
        };
      }
    }

    throw new Error(
      `환율 데이터 누락: ${from}→${to}, 기준일 ${toKSTDateStr(date)} 부근 ${this.fallbackDays + 1}일 내 데이터 없음`,
    );
  }
}
