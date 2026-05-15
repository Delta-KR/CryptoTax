'use server';

// TODO(Phase 7): Add IP-based rate limit (Upstash Redis or Vercel KV).
// calculate — 5 reqs / min per IP.

import { parseFile } from '@/lib/parsers/registry';
import { normalize } from '@/lib/engine/normalizer';
import { calculateTax } from '@/lib/engine/tax-calculator';
import {
  StaticExchangeRateProvider,
  type StaticRateEntry,
} from '@/lib/engine/exchange-rate';
import type {
  ParsedTransaction,
  TaxResult,
  UnifiedTransaction,
} from '@/lib/engine/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  MAX_PREV_STRING,
  previousParsedSchema,
  validateFileList,
} from '@/lib/validation/calculate';
import type {
  CalculatePayload,
  CalculateResult,
  ParsedTransactionWire,
  TaxResultWire,
  UnifiedTransactionWire,
} from './calculate.types';

async function getUserPlan(): Promise<'free' | 'premium'> {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 'free';
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle<{ plan: 'free' | 'premium' }>();
    return profile?.plan ?? 'free';
  } catch (e) {
    console.error('[getUserPlan] error:', e);
    return 'free';
  }
}

function maskForFree(wire: TaxResultWire): TaxResultWire {
  return {
    ...wire,
    taxableIncomeKRW: 0,
    taxAmountKRW: 0,
    incomeTaxKRW: 0,
    localTaxKRW: 0,
    realizedGains: [],
    summary: wire.summary.map((s) => ({ ...s, realizedPnLKRW: 0 })),
    masked: true,
  };
}

const DEFAULT_RATES: readonly StaticRateEntry[] = [
  ['2024-01-01', 'USDT', 'KRW', 1330],
  ['2024-04-01', 'USDT', 'KRW', 1370],
  ['2024-07-01', 'USDT', 'KRW', 1380],
  ['2024-10-01', 'USDT', 'KRW', 1370],
  ['2025-01-01', 'USDT', 'KRW', 1450],
  ['2025-04-01', 'USDT', 'KRW', 1440],
  ['2025-07-01', 'USDT', 'KRW', 1395],
  ['2025-10-01', 'USDT', 'KRW', 1500],
  ['2026-01-01', 'USDT', 'KRW', 1460],
  ['2026-04-01', 'USDT', 'KRW', 1488],
  ['2026-07-01', 'USDT', 'KRW', 1450],
  ['2026-10-01', 'USDT', 'KRW', 1500],
  ['2027-01-01', 'USDT', 'KRW', 1480],
  ['2027-04-01', 'USDT', 'KRW', 1500],
  ['2027-07-01', 'USDT', 'KRW', 1520],
  ['2027-10-01', 'USDT', 'KRW', 1550],
  ['2024-07-01', 'BTC', 'KRW', 80_000_000],
  ['2026-12-31', 'BTC', 'KRW', 150_000_000],
  ['2027-01-01', 'BTC', 'KRW', 150_000_000],
  ['2027-07-01', 'BTC', 'KRW', 160_000_000],
];

const DEEMED_COST_SNAPSHOTS = new Map<string, number>([
  ['USDT', 1500],
  ['USDC', 1500],
  ['BTC', 150_000_000],
  ['ETH', 5_000_000],
  ['SOL', 300_000],
  ['XRP', 800],
  ['DUSK', 5],
  ['GOAT', 800],
  ['ETC', 30_000],
  ['1000FLOKI', 200],
]);

function parsedToWire(tx: ParsedTransaction): ParsedTransactionWire {
  return { ...tx, date: tx.date.toISOString() };
}

function parsedFromWire(w: ParsedTransactionWire): ParsedTransaction {
  return { ...w, date: new Date(w.date) };
}

function unifiedToWire(tx: UnifiedTransaction): UnifiedTransactionWire {
  return { ...tx, date: tx.date.toISOString() };
}

function resultToWire(
  r: TaxResult,
  plan: 'free' | 'premium',
): TaxResultWire {
  return {
    ...r,
    realizedGains: r.realizedGains.map((g) => ({
      ...g,
      sellDate: g.sellDate.toISOString(),
    })),
    holdingsAfter: Object.fromEntries(
      Object.entries(r.holdingsAfter).map(([k, lots]) => [
        k,
        lots.map((l) => ({ ...l, date: l.date.toISOString() })),
      ]),
    ),
    plan,
    masked: false,
  };
}

function currentTargetYear(): number {
  const now = new Date();
  const kstYear = new Date(now.getTime() + 9 * 3600 * 1000).getUTCFullYear();
  return kstYear < 2027 ? 2027 : kstYear;
}

export async function calculateTaxFromFiles(
  formData: FormData,
): Promise<CalculateResult> {
  try {
    const rawFiles = formData.getAll('files');
    const files = rawFiles.filter((f): f is File => f instanceof File);

    const filesCheck = validateFileList(files);
    if (!filesCheck.ok) {
      return {
        ok: false,
        error: filesCheck.error ?? '파일 검증 실패',
        errorType: 'unsupported',
      };
    }

    const previousJson = formData.get('previousParsed');
    let previous: ParsedTransaction[] = [];
    if (typeof previousJson === 'string' && previousJson.length > 0) {
      if (previousJson.length > MAX_PREV_STRING) {
        return {
          ok: false,
          error: '누적된 거래 데이터가 너무 큽니다. 초기화 후 다시 업로드해주세요.',
          errorType: 'unknown',
        };
      }
      let rawPrev: unknown;
      try {
        rawPrev = JSON.parse(previousJson);
      } catch {
        return {
          ok: false,
          error: '저장된 거래 데이터를 읽을 수 없습니다. 초기화 후 다시 업로드해주세요.',
          errorType: 'unknown',
        };
      }
      const prevParsed = previousParsedSchema.safeParse(rawPrev);
      if (!prevParsed.success) {
        return {
          ok: false,
          error: '저장된 거래 데이터 형식이 올바르지 않습니다. 초기화 후 다시 업로드해주세요.',
          errorType: 'unknown',
        };
      }
      previous = prevParsed.data.map((w) =>
        parsedFromWire(w as ParsedTransactionWire),
      );
    }

    const newParsed: ParsedTransaction[] = [];
    for (const file of files) {
      const txs = await parseFile(file);
      newParsed.push(...txs);
    }

    if (newParsed.length === 0 && previous.length === 0) {
      return {
        ok: false,
        error: '처리할 거래 데이터가 없습니다.',
        errorType: 'unknown',
      };
    }

    const allParsed = [...previous, ...newParsed];
    const rates = new StaticExchangeRateProvider(DEFAULT_RATES, 35);
    const unified = await normalize(allParsed, rates);

    const year = currentTargetYear();
    const result = calculateTax({
      transactions: unified,
      year,
      deemedCostPrices: DEEMED_COST_SNAPSHOTS,
    });

    const plan = await getUserPlan();
    const wire = resultToWire(result, plan);
    const finalResult = plan === 'free' ? maskForFree(wire) : wire;

    const payload: CalculatePayload = {
      newParsed: newParsed.map(parsedToWire),
      allParsed: allParsed.map(parsedToWire),
      allUnified: unified.map(unifiedToWire),
      result: finalResult,
      year,
    };
    return { ok: true, payload };
  } catch (err) {
    console.error('[calculateTaxFromFiles] error:', err);
    const message =
      err instanceof Error ? err.message : '파일 처리 중 알 수 없는 오류';
    let errorType: 'parse' | 'unsupported' | 'unknown' = 'unknown';
    if (err instanceof Error) {
      if (err.name === 'UnsupportedFileError') errorType = 'unsupported';
      else if (err.name === 'ParseError') errorType = 'parse';
    }
    return { ok: false, error: message, errorType };
  }
}
