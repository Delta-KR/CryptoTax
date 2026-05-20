'use server';

// TODO(Phase 7): Add IP-based rate limit (Upstash Redis or Vercel KV).
// calculate — 5 reqs / min per IP.

import { parseFile } from '@/lib/parsers/registry';
import { normalize } from '@/lib/engine/normalizer';
import { calculateTax, type TaxMethod } from '@/lib/engine/tax-calculator';
import { DBExchangeRateProvider } from '@/lib/engine/rate-provider';
import { isPreDeemedDate } from '@/lib/engine/deemed-cost';
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
    summaryByExchange: wire.summaryByExchange.map((s) => ({
      ...s,
      realizedPnLKRW: 0,
    })),
    masked: true,
  };
}

// 시세는 Supabase daily_rates 테이블에서 우선 조회 (정적 fallback rates-data.ts).
// 의제취득가액 시가는 Supabase deemed_cost_snapshots 테이블에서 직접 조회.

interface DeemedSnapshotRow {
  coin: string;
  price_krw: number | string;
  source_type: 'real' | 'estimate' | 'user_override';
  deemed_date: string;
}

interface DeemedCostResolution {
  prices: Map<string, number>;
  realCoins: string[];
  estimateCoins: string[];
  userOverrideCoins: string[];
  missingCoins: string[];
  deemedDate: string;
}

async function resolveDeemedCostPrices(
  preCoins: ReadonlySet<string>,
): Promise<DeemedCostResolution> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('deemed_cost_snapshots')
    .select('coin, price_krw, source_type, deemed_date');

  const prices = new Map<string, number>();
  const realCoins: string[] = [];
  const estimateCoins: string[] = [];
  const userOverrideCoins: string[] = [];
  let deemedDate = '2026-12-31';

  if (error) {
    console.error('[resolveDeemedCostPrices] error:', error);
  } else if (data) {
    for (const row of data as DeemedSnapshotRow[]) {
      const price = Number(row.price_krw);
      if (!Number.isFinite(price) || price <= 0) continue;
      prices.set(row.coin, price);
      if (row.source_type === 'real') realCoins.push(row.coin);
      else if (row.source_type === 'estimate') estimateCoins.push(row.coin);
      else if (row.source_type === 'user_override') userOverrideCoins.push(row.coin);
      if (row.deemed_date) deemedDate = row.deemed_date;
    }
  }

  const missingCoins = Array.from(preCoins).filter((c) => !prices.has(c));
  realCoins.sort();
  estimateCoins.sort();
  userOverrideCoins.sort();
  missingCoins.sort();

  return {
    prices,
    realCoins,
    estimateCoins,
    userOverrideCoins,
    missingCoins,
    deemedDate,
  };
}

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
      consumedLots: g.consumedLots.map((cl) => ({
        ...cl,
        buyDate: cl.buyDate ? cl.buyDate.toISOString() : undefined,
      })),
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

    // method: 'fifo' | 'avg'. 미지정 또는 알 수 없는 값은 'fifo' 기본.
    const methodRaw = formData.get('method');
    const method: TaxMethod = methodRaw === 'avg' ? 'avg' : 'fifo';

    const allParsed = [...previous, ...newParsed];

    // DB(daily_rates) 우선 조회. preload로 거래 전체 (date × from_currency)를 한 번에 가져옴.
    const rates = new DBExchangeRateProvider(7);
    const dates = allParsed.map((tx) => tx.date);
    const fromCurrencies = Array.from(
      new Set(
        allParsed.flatMap((tx) => [tx.quoteCurrency, tx.feeCurrency]),
      ),
    );
    await rates.preload(dates, fromCurrencies);

    const unified = await normalize(allParsed, rates);

    // 의제취득가액 시가 — DB 조회. pre-2027 매수가 있는 코인만 관심.
    const preCoinsSet = new Set<string>();
    for (const tx of unified) {
      if (tx.type === 'BUY' && isPreDeemedDate(tx.date)) {
        preCoinsSet.add(tx.coin);
      }
    }
    const deemedRes = await resolveDeemedCostPrices(preCoinsSet);

    const year = currentTargetYear();
    const result = calculateTax({
      transactions: unified,
      year,
      deemedCostPrices: deemedRes.prices,
      method,
    });

    const plan = await getUserPlan();
    const wire = resultToWire(result, plan);
    const sourceInfo = rates.getSourceInfo();
    wire.rateSource = sourceInfo;
    wire.deemedCostSource = {
      realCoins: deemedRes.realCoins,
      estimateCoins: deemedRes.estimateCoins,
      userOverrideCoins: deemedRes.userOverrideCoins,
      missingCoins: deemedRes.missingCoins,
      deemedDate: deemedRes.deemedDate,
    };

    // 정적 fallback 사용 시 사용자에게 정확도 경고 추가.
    if (sourceInfo.fallbackUsed) {
      wire.warnings = [
        ...wire.warnings,
        '일부 거래에 정적 분기별 환율이 사용되었습니다 (DB에 일별 시세 미적재). 정확한 신고를 위해 시세 갱신 후 재계산을 권장합니다.',
      ];
    }

    // 의제취득가액 추정치 사용 시 경고. real로 갱신되기 전엔 모두 estimate.
    if (deemedRes.estimateCoins.length > 0 && preCoinsSet.size > 0) {
      const applied = deemedRes.estimateCoins.filter((c) =>
        preCoinsSet.has(c),
      );
      if (applied.length > 0) {
        wire.warnings = [
          ...wire.warnings,
          `의제취득가액 추정치 적용: ${applied.join(', ')}. ${deemedRes.deemedDate} 실시가 확정 후 재계산을 권장합니다.`,
        ];
      }
    }

    const finalResult = plan === 'free' ? maskForFree(wire) : wire;

    const payload: CalculatePayload = {
      newParsed: newParsed.map(parsedToWire),
      allParsed: allParsed.map(parsedToWire),
      allUnified: unified.map(unifiedToWire),
      result: finalResult,
      year,
      method,
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
