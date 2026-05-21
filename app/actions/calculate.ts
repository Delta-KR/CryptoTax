'use server';

// TODO(Phase 7): Add IP-based rate limit (Upstash Redis or Vercel KV).
// calculate — 5 reqs / min per IP.

import { parseFile } from '@/lib/parsers/registry';
import { normalize } from '@/lib/engine/normalizer';
import { calculateTax, type TaxMethod } from '@/lib/engine/tax-calculator';
import { DBExchangeRateProvider } from '@/lib/engine/rate-provider';
import { toKSTDateStr } from '@/lib/engine/exchange-rate';
import { isPreDeemedDate } from '@/lib/engine/deemed-cost';
import { dedupeParsedTransactions } from '@/lib/engine/dedupe';
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
    // v2 #1: 비교 카드도 premium 전용. 양쪽 모두 0으로 마스킹.
    methodComparison: wire.methodComparison
      ? {
          fifo: { netPnLKRW: 0, taxableIncomeKRW: 0, taxAmountKRW: 0 },
          ma: { netPnLKRW: 0, taxableIncomeKRW: 0, taxAmountKRW: 0 },
          selected: wire.methodComparison.selected,
        }
      : undefined,
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

interface UserOverrideRow {
  coin: string;
  price_krw: number | string;
  deemed_date: string;
}

async function resolveDeemedCostPrices(
  preCoins: ReadonlySet<string>,
): Promise<DeemedCostResolution> {
  const supabase = createSupabaseServerClient();

  // v2 #3: 사용자 override 우선 조회. RLS로 본인 row만 반환됨.
  // 글로벌 deemed_cost_snapshots는 fallback. user_override가 있는 코인은 그쪽 값 사용.
  const [globalRes, userOverrideRes] = await Promise.all([
    supabase
      .from('deemed_cost_snapshots')
      .select('coin, price_krw, source_type, deemed_date'),
    supabase
      .from('user_deemed_cost_overrides')
      .select('coin, price_krw, deemed_date'),
  ]);

  const prices = new Map<string, number>();
  const realCoins: string[] = [];
  const estimateCoins: string[] = [];
  const userOverrideCoins: string[] = [];
  let deemedDate = '2026-12-31';

  if (globalRes.error) {
    console.error('[resolveDeemedCostPrices] global error:', globalRes.error);
  } else if (globalRes.data) {
    for (const row of globalRes.data as DeemedSnapshotRow[]) {
      const price = Number(row.price_krw);
      if (!Number.isFinite(price) || price <= 0) continue;
      prices.set(row.coin, price);
      if (row.source_type === 'real') realCoins.push(row.coin);
      else if (row.source_type === 'estimate') estimateCoins.push(row.coin);
      // 글로벌 테이블에 user_override가 들어있는 케이스는 레거시. 새 사용자 입력은
      // 모두 user_deemed_cost_overrides로 들어감.
      else if (row.source_type === 'user_override') userOverrideCoins.push(row.coin);
      if (row.deemed_date) deemedDate = row.deemed_date;
    }
  }

  // 사용자 override 적용 — 글로벌 값을 덮어씀. 또한 source 분류를 user_override로 재분류.
  if (userOverrideRes.error) {
    console.error(
      '[resolveDeemedCostPrices] user override error:',
      userOverrideRes.error,
    );
  } else if (userOverrideRes.data) {
    for (const row of userOverrideRes.data as UserOverrideRow[]) {
      const price = Number(row.price_krw);
      if (!Number.isFinite(price) || price <= 0) continue;
      prices.set(row.coin, price);
      // 이미 다른 source로 분류돼 있으면 그 분류에서 제거하고 user_override로 이동.
      const idxReal = realCoins.indexOf(row.coin);
      if (idxReal >= 0) realCoins.splice(idxReal, 1);
      const idxEst = estimateCoins.indexOf(row.coin);
      if (idxEst >= 0) estimateCoins.splice(idxEst, 1);
      if (!userOverrideCoins.includes(row.coin)) {
        userOverrideCoins.push(row.coin);
      }
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
    const previousJson = formData.get('previousParsed');
    const hasPrevious =
      typeof previousJson === 'string' && previousJson.length > 0;

    const filesCheck = validateFileList(files, {
      allowEmpty: hasPrevious,
    });
    if (!filesCheck.ok) {
      return {
        ok: false,
        error: filesCheck.error ?? '파일 검증 실패',
        errorType: 'unsupported',
      };
    }
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

    // 같은 파일(또는 기간 겹친 파일) 재업로드 시 cost basis 2배 방지.
    // 모든 핵심 필드가 동일한 거래는 자동 제거. 결과 warnings에 N건 명시.
    const merged = [...previous, ...newParsed];
    const { unique: allParsed, duplicates: duplicateCount } =
      dedupeParsedTransactions(merged);

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
    // v2 백로그 #1: FIFO vs MA 자동 비교 — 양쪽 method 모두 계산.
    // 메인 결과는 사용자가 선택한 method, 비교 카드용 alternative 결과는 핵심 지표만.
    const fifoResult = calculateTax({
      transactions: unified,
      year,
      deemedCostPrices: deemedRes.prices,
      method: 'fifo',
    });
    const maResult = calculateTax({
      transactions: unified,
      year,
      deemedCostPrices: deemedRes.prices,
      method: 'avg',
    });
    const result = method === 'avg' ? maResult : fifoResult;

    const plan = await getUserPlan();
    const wire = resultToWire(result, plan);
    wire.methodComparison = {
      fifo: {
        netPnLKRW: fifoResult.netPnLKRW,
        taxableIncomeKRW: fifoResult.taxableIncomeKRW,
        taxAmountKRW: fifoResult.taxAmountKRW,
      },
      ma: {
        netPnLKRW: maResult.netPnLKRW,
        taxableIncomeKRW: maResult.taxableIncomeKRW,
        taxAmountKRW: maResult.taxAmountKRW,
      },
      selected: method === 'avg' ? 'ma' : 'fifo',
    };
    const sourceInfo = rates.getSourceInfo();
    // fallbackDateRange는 server-only (warning 메시지 작성에만 사용). wire에는 제외.
    wire.rateSource = {
      primary: sourceInfo.primary,
      fallbackUsed: sourceInfo.fallbackUsed,
      lastFetchedAt: sourceInfo.lastFetchedAt,
      fallbackName: sourceInfo.fallbackName,
    };
    wire.deemedCostSource = {
      realCoins: deemedRes.realCoins,
      estimateCoins: deemedRes.estimateCoins,
      userOverrideCoins: deemedRes.userOverrideCoins,
      missingCoins: deemedRes.missingCoins,
      deemedDate: deemedRes.deemedDate,
    };

    // 중복 자동 제거 알림 — 같은 파일을 두 번 올렸거나 기간이 겹치는 파일을 합친 케이스.
    if (duplicateCount > 0) {
      wire.warnings = [
        ...wire.warnings,
        `중복 거래 ${duplicateCount}건이 자동 제거되었습니다 (거래소·시각·코인·수량·가격·수수료가 모두 동일한 거래).`,
      ];
    }

    // 정적 fallback 사용 시 컨텍스트에 맞는 안내. 미래 시점 거래는 갱신 불가하니
    // 메시지를 다르게 표시 (오늘 KST 기준 비교).
    if (sourceInfo.fallbackUsed) {
      const range = sourceInfo.fallbackDateRange;
      const todayKst = toKSTDateStr(new Date());
      const rangeStr = range
        ? range.earliest === range.latest
          ? range.earliest
          : `${range.earliest} ~ ${range.latest}`
        : null;
      const isAllFuture = range !== null && range.earliest > todayKst;
      const baseMsg = rangeStr
        ? `일부 거래(${rangeStr})에 분기별 환율 추정치가 사용됐습니다.`
        : '일부 거래에 분기별 환율 추정치가 사용됐습니다.';
      const tailMsg = isAllFuture
        ? ' 미래 시점 거래라 실 시세 미존재 — 거래일 도래 후 시세 적재 시 재계산을 권장합니다.'
        : ' DB에 일별 시세 미적재. 정확한 신고를 위해 시세 갱신 후 재계산을 권장합니다.';
      wire.warnings = [...wire.warnings, baseMsg + tailMsg];
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
