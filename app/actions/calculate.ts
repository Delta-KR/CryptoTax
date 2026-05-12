'use server';

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
import type {
  CalculatePayload,
  CalculateResult,
  ParsedTransactionWire,
  TaxResultWire,
  UnifiedTransactionWire,
} from './calculate.types';

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

function resultToWire(r: TaxResult): TaxResultWire {
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
    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return {
        ok: false,
        error: '파일이 첨부되지 않았습니다.',
        errorType: 'unknown',
      };
    }

    const previousJson = formData.get('previousParsed');
    const previous: ParsedTransaction[] =
      typeof previousJson === 'string' && previousJson
        ? (JSON.parse(previousJson) as ParsedTransactionWire[]).map(
            parsedFromWire,
          )
        : [];

    const newParsed: ParsedTransaction[] = [];
    for (const file of files) {
      const txs = await parseFile(file);
      newParsed.push(...txs);
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

    const payload: CalculatePayload = {
      newParsed: newParsed.map(parsedToWire),
      allParsed: allParsed.map(parsedToWire),
      allUnified: unified.map(unifiedToWire),
      result: resultToWire(result),
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
