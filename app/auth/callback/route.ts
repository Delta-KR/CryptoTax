import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth/safe-next';
import { classifyOAuthError } from '@/lib/auth/oauth-errors';

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
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] exchange error:', error);
      const loginUrl = url.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('error', classifyOAuthError(error.message));
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
