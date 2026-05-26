import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePremium } from '@/lib/auth/server';
import { ensureFontRegistered } from '@/lib/report/font-config';
import { TaxReport } from '@/lib/report/tax-report';
import { reportRequestSchema } from '@/lib/validation/report';
import { SITE_URL } from '@/lib/site';
import {
  checkRateLimit,
  getReportRateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';
import { calculateTax } from '@/lib/engine/tax-calculator';
import { isPreDeemedDate } from '@/lib/engine/deemed-cost';
import {
  resolveDeemedCostPrices,
  resolveImputedExpenseCoins,
} from '@/lib/engine/resolvers';
import { buildDeemedCostWire, resultToWire, unifiedFromWire } from '@/lib/engine/wire';
import { getClientIp } from '@/lib/auth/client-ip';

export const maxDuration = 60;

// Rate limit (P4-R1): Upstash Redis sliding window. 무거운 PDF 생성 보호 + DoS 방어. fail-closed.

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  // 동일 출처 요청은 일부 브라우저가 Origin을 생략 — Referer로 fallback.
  const candidate = origin ?? referer;
  if (!candidate) {
    // POST에 둘 다 없으면 의심. 보수적으로 차단.
    return false;
  }
  try {
    const candidateUrl = new URL(candidate);
    const allowed = new URL(SITE_URL);
    if (candidateUrl.origin === allowed.origin) return true;
    // Vercel preview 도메인도 허용 (*.vercel.app).
    if (
      process.env.VERCEL &&
      candidateUrl.hostname.endsWith('.vercel.app')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json(
        { error: 'Cross-origin request blocked' },
        { status: 403 },
      );
    }

    // 1차 rate limit (IP 기반) — auth 전. 익명 폭주 차단.
    const ip = getClientIp(request);
    const ipResult = await checkRateLimit(`ip:${ip}`, getReportRateLimit());
    if (!ipResult.ok) {
      return rateLimitResponse(ipResult, '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    }

    const guard = await requirePremium('PDF 리포트 다운로드');
    if (!guard.ok) {
      const status = guard.reason === 'unauthenticated' ? 401 : 403;
      const error =
        guard.reason === 'not_premium'
          ? 'PDF 리포트 다운로드는 프리미엄 전용 기능입니다. 업그레이드 후 이용해주세요.'
          : guard.error;
      return NextResponse.json({ error }, { status });
    }

    // 2차 rate limit (user 기반) — corporate NAT 의 타 사용자가 같은 IP 한도를 소진하지 않도록.
    const userResult = await checkRateLimit(
      `user:${guard.userId}`,
      getReportRateLimit(),
    );
    if (!userResult.ok) {
      return rateLimitResponse(
        userResult,
        'PDF 다운로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      );
    }

    // 다운로드 메타데이터(파일명 생성) — requirePremium 가 이미 가져온 정보 재사용 (P1-3).
    const supabase = await createSupabaseServerClient();

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { error: '리포트 요청 본문이 올바른 JSON 형식이 아닙니다.' },
        { status: 400 },
      );
    }

    const parsed = reportRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: '리포트 요청 데이터가 올바르지 않습니다.',
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    const body = parsed.data;

    // C4: 거주자 양도소득은 시행령 §88①에 따라 총평균법만 신고 가능.
    // fifo/avg 결과로 만든 PDF는 신고서로 쓸 수 없으므로 다운로드 차단.
    // method 미전송(legacy session) 시 totalAverage로 간주.
    const requestedMethod = body.method ?? 'totalAverage';
    if (requestedMethod !== 'totalAverage') {
      return NextResponse.json(
        {
          error:
            '거주자 가상자산 양도소득은 시행령 §88①에 따라 총평균법만 신고 가능합니다. 참고용 계산 결과(FIFO/이동평균)는 PDF로 다운로드할 수 없습니다.',
        },
        { status: 400 },
      );
    }

    // C5: 서버 재계산. client가 보낸 `body.result`는 신뢰하지 않음 — 사용자가
    // DevTools로 0원 신고서를 만들 수 있으므로. transactions만 zod 검증된 입력으로
    // 받아서, 의제 시가 + 의제 50% 코인 + 환율 출처는 서버 DB에서 다시 조회.
    const transactions = body.transactions.map(unifiedFromWire);
    const preCoinsSet = new Set<string>();
    for (const tx of transactions) {
      if (tx.type === 'BUY' && isPreDeemedDate(tx.date)) {
        preCoinsSet.add(tx.coin);
      }
    }
    // rateMeta 쿼리는 deemed/imputed resolver 와 함께 병렬 (E#1 — 70~120ms 절감).
    // calculateTax 결과나 resolver 출력에 의존하지 않으므로 같은 Promise.all 에서 안전.
    const [deemedRes, imputedExpenseCoins, rateMetaRow] = await Promise.all([
      resolveDeemedCostPrices(preCoinsSet),
      resolveImputedExpenseCoins(),
      supabase
        .from('daily_rates')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ fetched_at: string }>()
        .then((r) => r.data),
    ]);

    const serverResult = calculateTax({
      transactions,
      year: body.year,
      method: 'totalAverage', // C4 가드로 여기까지 오면 항상 totalAverage.
      deemedCostPrices: deemedRes.prices,
      imputedExpenseCoins,
    });

    // wire 변환 + 출처 메타. rateSource 는 server-controlled (P1-3 client trust 제거).
    const wire = resultToWire(serverResult, 'premium');
    wire.rateSource = {
      primary: '내부 DB 시세 (서버 재검증)',
      fallbackUsed: false,
      lastFetchedAt: rateMetaRow?.fetched_at ?? null,
      fallbackName: '정적 분기별 환율 (fallback)',
    };
    wire.deemedCostSource = buildDeemedCostWire(deemedRes);

    ensureFontRegistered();

    const userName = guard.userName;

    const pdfBuffer = await renderToBuffer(
      TaxReport({
        userName,
        year: body.year,
        result: wire,
        transactions: body.transactions,
        method: 'totalAverage',
      }),
    );

    const filename = encodeURIComponent(
      `Kontaxt_${body.year}_${userName}.pdf`,
    );
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    console.error('[/api/report] error:', e);
    return NextResponse.json(
      { error: 'PDF 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
