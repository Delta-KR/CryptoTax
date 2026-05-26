import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth/safe-next';
import { classifyOAuthError } from '@/lib/auth/oauth-errors';
import { sendWelcomeEmail } from '@/lib/email/send';

const LAW_EFFECTIVE_DATE = '2027-01-01';

function daysUntilLawEffective(): number {
  const target = new Date(LAW_EFFECTIVE_DATE);
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));
  const errorParam = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (errorParam) {
    console.error('[auth/callback] provider error:', errorParam, errorDescription);
    const loginUrl = url.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set(
      'error',
      classifyOAuthError(errorDescription ?? errorParam),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] exchange error:', error);
      const loginUrl = url.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('error', classifyOAuthError(error.message));
      return NextResponse.redirect(loginUrl);
    }

    // Welcome 메일 — 첫 인증 성공 시에만 (created_at == last_sign_in_at).
    // fire-and-forget: 메일 실패가 로그인을 막으면 안 됨.
    const user = data.user;
    if (user?.email && user.created_at === user.last_sign_in_at) {
      void sendWelcomeEmail({
        to: user.email,
        userName:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined),
        dashboardUrl: `${url.origin}/dashboard`,
        daysUntilLaw: daysUntilLawEffective(),
      }).catch((err) => {
        console.error('[auth/callback] welcome email failed:', err);
      });
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
