import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

// Naver는 Supabase native OAuth provider가 아니라 자체 flow로 구현:
//   /api/auth/naver/start  →  Naver authorize URL로 redirect (이 파일)
//   /api/auth/naver/callback  →  code 교환 + 사용자 정보 fetch + Supabase admin
//                                magic link 발급 + 그 URL로 redirect (자동 세션)

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/login?error=server_error', request.nextUrl.origin));
  }

  const state = randomBytes(16).toString('hex');
  const redirectUri = `${request.nextUrl.origin}/api/auth/naver/callback`;

  const authorizeUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  // state cookie로 CSRF 방어 — callback에서 검증
  response.cookies.set('naver_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return response;
}
