import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensureFontRegistered } from '@/lib/report/font-config';
import { TaxReport } from '@/lib/report/tax-report';
import { reportRequestSchema } from '@/lib/validation/report';
import { SITE_URL } from '@/lib/site';

export const maxDuration = 60;

// TODO(Phase 7): Add IP-based rate limit (Upstash Redis or Vercel KV).
// /api/report — 1 req / 10s per user.

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle<{ plan: 'free' | 'premium' }>();

    if (profile?.plan !== 'premium') {
      return NextResponse.json(
        {
          error:
            'PDF 리포트 다운로드는 프리미엄 전용 기능입니다. 업그레이드 후 이용해주세요.',
        },
        { status: 403 },
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

    ensureFontRegistered();

    const userName =
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split('@')[0] ??
      '사용자';

    const pdfBuffer = await renderToBuffer(
      TaxReport({
        userName,
        year: body.year,
        result: body.result,
        transactions: body.transactions,
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
