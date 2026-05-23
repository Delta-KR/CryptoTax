import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { checkRateLimit, getOAuthStartRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/auth/client-ip';
import { NAVER_STATE_COOKIE } from '@/lib/auth/naver';

// Naver는 Supabase native OAuth provider가 아니라 자체 flow로 구현:
//   /api/auth/naver/start  →  Naver authorize URL로 redirect (이 파일)
//   /api/auth/naver/callback  →  code 교환 + Supabase admin magic link → /auth/finish

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/login?error=server_error', request.nextUrl.origin));
  }

  // Rate limit (IP 기반) — generateLink 쿼터·magic link 발급 비용 보호.
  // 인증 전 단계라 IP 외엔 식별자가 없음. fail-closed.
  const ip = getClientIp(request);
  const { ok } = await checkRateLimit(`oauth-start:${ip}`, getOAuthStartRateLimit());
  if (!ok) {
    return NextResponse.redirect(
      new URL('/login?error=rate_limited', request.nextUrl.origin),
    );
  }

  const state = randomBytes(16).toString('hex');
  const redirectUri = `${request.nextUrl.origin}/api/auth/naver/callback`;

  const authorizeUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  // state cookie로 CSRF 방어 — callback에서 검증.
  // __Host- prefix 가 path=/, secure, no domain 을 강제 → 서브도메인에서 fixation 불가.
  // sameSite: strict — start endpoint 는 사용자 navigation 으로만 진입, third-party 호출 없음.
  response.cookies.set(NAVER_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 600,
    path: '/',
  });
  return response;
}
