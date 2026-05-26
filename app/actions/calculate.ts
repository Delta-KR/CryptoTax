'use server';

// Rate limit (P4-R1): user.id 기반 분당 20회 (lib/rate-limit.ts).
// 익명 사용자는 IP fallback. headers()로 x-forwarded-for 추출.

import { headers } from 'next/headers';
import { parseFile } from '@/lib/parsers/registry';
import { normalize } from '@/lib/engine/normalizer';
import { calculateTax, type TaxMethod } from '@/lib/engine/tax-calculator';
import { DBExchangeRateProvider } from '@/lib/engine/rate-provider';
import { toKSTDateStr, kstYearOf } from '@/lib/engine/exchange-rate';
import { isPreDeemedDate } from '@/lib/engine/deemed-cost';
import { dedupeParsedTransactions } from '@/lib/engine/dedupe';
import type { ParsedTransaction } from '@/lib/engine/types';
import { getAuthedUser, getEffectivePlan } from '@/lib/auth/server';
import { checkRateLimit, getCalculateRateLimit } from '@/lib/rate-limit';
import {
  MAX_PREV_STRING,
  previousParsedSchema,
  validateFileList,
} from '@/lib/validation/calculate';
import type {
  CalculatePayload,
  CalculateResult,
  ParsedTransactionWire,
} from './calculate.types';
import {
  buildDeemedCostWire,
  maskForFree,
  parsedFromWire,
  parsedToWire,
  resultToWire,
  unifiedToWire,
} from '@/lib/engine/wire';
import {
  resolveDeemedCostPrices,
  resolveImputedExpenseCoins,
} from '@/lib/engine/resolvers';

// maskForFree, resolveDeemedCostPrices, resolveImputedExpenseCoins:
//   PR #17에서 lib/engine/wire.ts + lib/engine/resolvers.ts로 추출.
//   PDF route(/api/report)와 공유.

// 시세는 Supabase daily_rates 테이블에서 우선 조회 (정적 fallback rates-data.ts).
// 의제취득가액 시가 + 의제 50% 코인 조회는 lib/engine/resolvers.ts로 분리 (PDF route에서도 재사용).

function currentTargetYear(): number {
  const year = kstYearOf(new Date());
  return year < 2027 ? 2027 : year;
}

async function getRateLimitIdentifier(): Promise<string> {
  // getAuthedUser 는 React.cache — 같은 요청 안에서 getEffectivePlan 가 재호출 시 dedup.
  const user = await getAuthedUser();
  if (user) return `user:${user.id}`;

  // 익명 fallback — server action에서는 NextRequest 객체가 없어 next/headers의
  // x-forwarded-for를 사용.
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return `ip:${first}`;
  }
  const real = h.get('x-real-ip');
  if (real) return `ip:${real}`;
  return 'ip:unknown';
}

export async function calculateTaxFromFiles(
  formData: FormData,
): Promise<CalculateResult> {
  try {
    // Rate limit (P4-R1): user.id 우선, 익명은 IP. 분당 20회.
    const identifier = await getRateLimitIdentifier();
    const { ok: rlOk } = await checkRateLimit(identifier, getCalculateRateLimit());
    if (!rlOk) {
      return {
        ok: false,
        error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        errorType: 'unknown',
      };
    }

    // Plan 조회는 calculateTax 결과와 무관 — critical path 밖에서 미리 시작
    // (Supabase RTT를 normalize/calculateTax 와 겹쳐서 ~50~100ms 절감).
    // catch 는 getEffectivePlan 내부에서 처리 (실패 시 'free' fallback).
    const planPromise = getEffectivePlan();

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

    // 멀티 파일 업로드(업비트 PDF + 바이낸스 CSV + 빗썸 XLS 등) 시 파싱을 병렬화.
    // pdf-parse / papaparse 가 async I/O 라 직렬 await 면 N배 latency. Promise.all 로
    // 동시 처리하되 push 순서는 files 배열 순서 그대로 유지 (flat 가 보존).
    const parsedPerFile = await Promise.all(files.map((f) => parseFile(f)));
    const newParsed: ParsedTransaction[] = parsedPerFile.flat();

    if (newParsed.length === 0 && previous.length === 0) {
      return {
        ok: false,
        error: '처리할 거래 데이터가 없습니다.',
        errorType: 'unknown',
      };
    }

    // 거주자 디폴트 'totalAverage' (시행령 §88①). 'fifo'/'avg'는 비거주자 모드(§183⑥) 또는 참고용.
    const methodRaw = formData.get('method');
    const method: TaxMethod =
      methodRaw === 'fifo' || methodRaw === 'avg' || methodRaw === 'totalAverage'
        ? methodRaw
        : 'totalAverage';

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
    // 두 resolver 는 서로 독립 — Promise.all 로 ~70~120ms 절감.
    // /api/report 라우트(route.ts:142)도 동일 패턴 적용 중.
    const [deemedRes, imputedExpenseCoins] = await Promise.all([
      resolveDeemedCostPrices(preCoinsSet),
      resolveImputedExpenseCoins(),
    ]);

    const year = currentTargetYear();
    // 거주자 단일 method 계산 (시행령 §88① 총평균법 디폴트). v2 #1 듀얼 계산은 법령 정립
    // 결과 폐기 — 거주자에게 FIFO/MA는 비표준이라 비교 무의미.
    // imputedExpenseCoins(§88④⑤): 사용자가 토글한 코인은 매도가액의 50%가 필요경비로 의제.
    const result = calculateTax({
      transactions: unified,
      year,
      deemedCostPrices: deemedRes.prices,
      method,
      imputedExpenseCoins,
    });

    // 위쪽 rate limit 통과 직후 시작한 planPromise — 이 시점에선 거의 즉시 resolve.
    const plan = await planPromise;
    const wire = resultToWire(result, plan);
    const sourceInfo = rates.getSourceInfo();
    // fallbackDateRange는 server-only (warning 메시지 작성에만 사용). wire에는 제외.
    wire.rateSource = {
      primary: sourceInfo.primary,
      fallbackUsed: sourceInfo.fallbackUsed,
      lastFetchedAt: sourceInfo.lastFetchedAt,
      fallbackName: sourceInfo.fallbackName,
    };
    wire.deemedCostSource = buildDeemedCostWire(deemedRes);

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
