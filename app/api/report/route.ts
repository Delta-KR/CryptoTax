import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePremium } from '@/lib/auth/server';
import { ensureFontRegistered } from '@/lib/report/font-config';
import { TaxReport } from '@/lib/report/tax-report';
import { reportRequestSchema } from '@/lib/validation/report';
import { SITE_URL } from '@/lib/site';
import { checkRateLimit, getReportRateLimit } from '@/lib/rate-limit';
import { calculateTax } from '@/lib/engine/tax-calculator';
import { isPreDeemedDate } from '@/lib/engine/deemed-cost';
import {
  resolveDeemedCostPrices,
  resolveImputedExpenseCoins,
} from '@/lib/engine/resolvers';
import { resultToWire, unifiedFromWire } from '@/lib/engine/wire';

export const maxDuration = 60;

// Rate limit (P4-R1): Upstash Redis sliding window, IP 기반 분당 10회.
// 무거운 PDF 생성 작업 보호 + DoS 방어. fail-closed.

function getClientIp(request: NextRequest): string {
  // Vercel/Cloudflare 등 proxy 환경에서는 x-forwarded-for 첫 항목이 client IP.
  // 로컬 dev나 proxy 없는 환경에서는 fallback.
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

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

    // Rate limit (P4-R1): IP 기반 분당 10회. PDF 생성 비용이 크므로 무거운 보호.
    // Auth 전에 체크하여 무차별 호출을 빠르게 차단.
    const ip = getClientIp(request);
    const { ok: rateLimitOk, limit, remaining, reset } = await checkRateLimit(
      ip,
      getReportRateLimit(),
    );
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
            'Retry-After': String(
              Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
            ),
          },
        },
      );
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

    // 다운로드 메타데이터(파일명 생성)에 user 객체가 필요해 한 번 더 가져옴.
    // requirePremium 내부에서 이미 검증된 user — 여기서는 null 가드만.
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

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
    const [deemedRes, imputedExpenseCoins] = await Promise.all([
      resolveDeemedCostPrices(preCoinsSet),
      resolveImputedExpenseCoins(),
    ]);

    const serverResult = calculateTax({
      transactions,
      year: body.year,
      method: 'totalAverage', // C4 가드로 인해 여기까지 오면 항상 totalAverage.
      deemedCostPrices: deemedRes.prices,
      imputedExpenseCoins,
    });

    // wire 변환 + 출처 메타데이터 부여 (PDF audit trail용).
    // rateSource는 클라이언트가 보낸 값을 그대로 신뢰 — pricePerUnitKRW 자체는
    // 검증된 transactions에 박혀 있고, rateSource는 표시용 메타에 불과.
    // 잘못 표시될 경우 audit trail이 부정확해지지만 세액 자체는 영향 없음.
    const wire = resultToWire(serverResult, 'premium');
    wire.rateSource = body.result.rateSource;
    wire.deemedCostSource = {
      realCoins: deemedRes.realCoins,
      estimateCoins: deemedRes.estimateCoins,
      userOverrideCoins: deemedRes.userOverrideCoins,
      missingCoins: deemedRes.missingCoins,
      deemedDate: deemedRes.deemedDate,
    };

    ensureFontRegistered();

    const userName =
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split('@')[0] ??
      '사용자';

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
