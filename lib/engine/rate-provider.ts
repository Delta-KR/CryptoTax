import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Currency } from './types';
import {
  StaticExchangeRateProvider,
  toKSTDateStr,
  type ExchangeRateProvider,
  type RateResolution,
} from './exchange-rate';
import { DAILY_RATES_FALLBACK, RATES_FALLBACK_SOURCE } from './rates-data';

const MS_PER_DAY = 24 * 3600 * 1000;

export interface RateSourceInfo {
  primary: string; // DB에 적재된 실데이터 출처 (예: 'Upbit')
  fallbackUsed: boolean; // 정적 fallback이 한 번이라도 사용됐는지
  lastFetchedAt: string | null; // DB 최신 fetched_at (ISO)
  fallbackName: string;
}

interface DBRow {
  date: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: string;
  fetched_at: string;
}

// Cache entry — preload된 daily_rates row의 환율 + 출처. sourceDate는 cache key에서 추출.
interface CacheEntry {
  rate: number;
  sourceName: string;
}

// DB(daily_rates)에서 시세를 조회하고, 미스 시 정적 fallback. 둘 다 실패 시 throw.
// `preload`로 전체 거래의 (from, date) 조합을 한 번에 가져와 normalize 중 in-memory 조회.
export class DBExchangeRateProvider implements ExchangeRateProvider {
  private cache = new Map<string, CacheEntry>();
  private staticFallback: StaticExchangeRateProvider;
  private fallbackDays: number;
  private fallbackUsed = false;
  private latestFetchedAt: string | null = null;
  private primarySource: string | null = null;

  constructor(fallbackDays = 7) {
    this.fallbackDays = fallbackDays;
    this.staticFallback = new StaticExchangeRateProvider(
      DAILY_RATES_FALLBACK,
      // 정적 fallback은 분기별이라 35일까지 봐도 됨 (실제로 90일 차이도 있음)
      90,
      RATES_FALLBACK_SOURCE.name,
    );
  }

  // normalize 시작 전에 호출. 거래의 (date, from_currency) 후보 전체를 한 번에 적재.
  async preload(
    dates: ReadonlyArray<Date>,
    fromCurrencies: ReadonlyArray<Currency>,
  ): Promise<void> {
    const datesNeeded = new Set<string>();
    for (const d of dates) {
      // fallbackDays까지 거슬러 올라간 날짜도 미리 수집
      for (let i = 0; i <= this.fallbackDays; i++) {
        const back = new Date(d.getTime() - i * MS_PER_DAY);
        datesNeeded.add(toKSTDateStr(back));
      }
    }
    const dateStrs = Array.from(datesNeeded);
    const fromList = Array.from(
      new Set(fromCurrencies.filter((c) => c !== 'KRW')),
    );

    if (dateStrs.length === 0 || fromList.length === 0) return;

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('daily_rates')
      .select('date, from_currency, to_currency, rate, source, fetched_at')
      .in('date', dateStrs)
      .in('from_currency', fromList)
      .eq('to_currency', 'KRW');

    if (error) {
      console.error('[DBExchangeRateProvider] preload error:', error);
      return;
    }
    if (!data || data.length === 0) return;

    for (const row of data as DBRow[]) {
      const key = `${row.date}|${row.from_currency}|${row.to_currency}`;
      this.cache.set(key, {
        rate: Number(row.rate),
        sourceName: row.source,
      });
      if (!this.primarySource) this.primarySource = row.source;
      if (
        !this.latestFetchedAt ||
        row.fetched_at > this.latestFetchedAt
      ) {
        this.latestFetchedAt = row.fetched_at;
      }
    }
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

    // 1) Cache (preload 결과) — 거래일에서 fallbackDays까지 거슬러 올라가며 시도
    for (let i = 0; i <= this.fallbackDays; i++) {
      const d = new Date(date.getTime() - i * MS_PER_DAY);
      const sourceDate = toKSTDateStr(d);
      const key = `${sourceDate}|${from}|${to}`;
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        return {
          rate: cached.rate,
          sourceDate,
          source: 'db',
          sourceName: cached.sourceName,
        };
      }
    }

    // 2) 정적 fallback (분기별 — 정확도 낮음, 사용 시 flag)
    try {
      const r = await this.staticFallback.getRateWithMeta(date, from, to);
      this.fallbackUsed = true;
      return r;
    } catch {
      throw new Error(
        `환율 데이터 누락: ${from}→${to}, 기준일 ${toKSTDateStr(date)} 부근 데이터 없음 (DB + 정적 fallback 모두 미스)`,
      );
    }
  }

  getSourceInfo(): RateSourceInfo {
    return {
      primary: this.primarySource ?? '(DB 미적재)',
      fallbackUsed: this.fallbackUsed,
      lastFetchedAt: this.latestFetchedAt,
      fallbackName: RATES_FALLBACK_SOURCE.name,
    };
  }
}
