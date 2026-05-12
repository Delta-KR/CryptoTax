import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensureFontRegistered } from '@/lib/report/font-config';
import { TaxReport } from '@/lib/report/tax-report';
import type {
  TaxResultWire,
  UnifiedTransactionWire,
} from '@/app/actions/calculate.types';

interface RequestBody {
  result: TaxResultWire;
  transactions: UnifiedTransactionWire[];
  year: number;
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
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

    const body = (await request.json()) as RequestBody;
    if (!body.result || typeof body.year !== 'number') {
      return NextResponse.json(
        { error: '리포트 생성에 필요한 데이터가 부족합니다.' },
        { status: 400 },
      );
    }

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
        transactions: body.transactions ?? [],
      }),
    );

    const filename = encodeURIComponent(
      `크립토택스_${body.year}_${userName}.pdf`,
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
      {
        error:
          'PDF 생성 중 오류가 발생했습니다: ' +
          (e instanceof Error ? e.message : String(e)),
      },
      { status: 500 },
    );
  }
}
