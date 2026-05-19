import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// Naver OAuth 콜백:
// 1. state 검증 (CSRF)
// 2. code → Naver access_token 교환
// 3. access_token → Naver 사용자 정보 (email, name) fetch
// 4. Supabase admin generateLink로 magic link 발급 (이메일 발송 X, URL만 받음)
// 5. magic link로 server-side redirect → Supabase가 자동 세션 발급 + /dashboard로 이동
//
// iCloud Mail prefetch issue 무관 — 사용자 클릭 안 함, server redirect로 즉시 처리.

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = request.cookies.get('naver_oauth_state')?.value;

  // 1. state CSRF 검증
  if (!code || !state || !cookieState || state !== cookieState) {
    console.error('[naver/callback] state mismatch or missing code');
    return NextResponse.redirect(new URL('/login?error=invalid_request', url.origin));
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('[naver/callback] missing NAVER_CLIENT_ID/SECRET env');
    return NextResponse.redirect(new URL('/login?error=server_error', url.origin));
  }

  try {
    // 2. code → access_token
    const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
      }).toString(),
    });
    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!tokenData.access_token) {
      console.error('[naver/callback] token exchange failed:', tokenData.error);
      return NextResponse.redirect(new URL('/login?error=server_error', url.origin));
    }

    // 3. access_token → 사용자 정보
    const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = (await userResponse.json()) as {
      resultcode?: string;
      response?: { email?: string; name?: string; nickname?: string; id?: string };
    };
    const naverUser = userData.response;
    if (!naverUser?.email) {
      console.error('[naver/callback] no email from Naver — required scope missing?');
      return NextResponse.redirect(new URL('/login?error=access_denied', url.origin));
    }

    // 4. Supabase admin: 사용자 upsert + magic link 발급
    //    redirectTo는 /auth/finish (client component) — magic link verify가
    //    URL fragment에 access_token을 박아 보내는데, server middleware는
    //    fragment를 못 보므로 client-side에서 setSession 명시 호출 필요.
    const admin = createSupabaseAdminClient();
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: naverUser.email,
      options: {
        redirectTo: `${url.origin}/auth/finish`,
        // 신규 가입자에게만 user_metadata로 박힘. 기존 사용자는 그대로.
        data: {
          name: naverUser.name || naverUser.nickname,
          provider: 'naver',
        },
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[naver/callback] generateLink failed:', linkError);
      return NextResponse.redirect(new URL('/login?error=server_error', url.origin));
    }

    // 5. magic link로 redirect → Supabase가 verify + 세션 발급 + /dashboard로 이동
    const response = NextResponse.redirect(linkData.properties.action_link);
    response.cookies.delete('naver_oauth_state');
    return response;
  } catch (e) {
    console.error('[naver/callback] unexpected error:', e);
    return NextResponse.redirect(new URL('/login?error=server_error', url.origin));
  }
}
