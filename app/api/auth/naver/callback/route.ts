import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { findUserByEmail } from '@/lib/supabase/admin-lookup';
import { checkRateLimit, getOAuthStartRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/auth/client-ip';
import { NAVER_STATE_COOKIE } from '@/lib/auth/naver';

// Naver OAuth 콜백:
// 1. state 검증 (CSRF)
// 2. code → access_token → 사용자 정보 fetch
// 3. 다른 provider 로 가입된 email 인지 검증 (C2 account takeover 차단)
// 4. Supabase admin generateLink → /auth/finish 로 redirect → 자동 세션
// 5. app_metadata.provider=naver 명시

export const runtime = 'nodejs';

// Wave 1 사후 review F2 — 모든 failure branch 에서 NAVER_STATE_COOKIE 삭제.
// 이전: 성공 path 만 cleanup. 실패 branch 들이 cookie 남겨서 10분 maxAge 동안
// replay window 존재. state 가 random hex + httpOnly 라 실제 exploit 어려움
// 이지만 defense-in-depth.
function redirectLoginWithCookieCleanup(
  origin: string,
  errorCode: string,
): NextResponse {
  const response = NextResponse.redirect(
    new URL(`/login?error=${errorCode}`, origin),
  );
  response.cookies.delete(NAVER_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = request.cookies.get(NAVER_STATE_COOKIE)?.value;

  // state CSRF 검증을 먼저 — invalid state 일 때만 (의심 트래픽) rate limit 으로 차단.
  // 정상 OAuth 흐름은 start 단계의 limiter 가 이미 보호 중이므로 callback 중복 호출 안 함.
  if (!code || !state || !cookieState || state !== cookieState) {
    console.error('[naver/callback] state mismatch or missing code');
    const ip = getClientIp(request);
    const { ok: rlOk } = await checkRateLimit(`oauth-cb:${ip}`, getOAuthStartRateLimit());
    if (!rlOk) {
      return redirectLoginWithCookieCleanup(url.origin, 'rate_limited');
    }
    return redirectLoginWithCookieCleanup(url.origin, 'invalid_request');
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('[naver/callback] missing NAVER_CLIENT_ID/SECRET env');
    return redirectLoginWithCookieCleanup(url.origin, 'server_error');
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
      refresh_token?: string;
      expires_in?: string;
      token_type?: string;
      error?: string;
      error_description?: string;
    };
    if (!tokenData.access_token) {
      console.error('[naver/callback] token exchange failed');
      return redirectLoginWithCookieCleanup(url.origin, 'server_error');
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
      return redirectLoginWithCookieCleanup(url.origin, 'access_denied');
    }

    // 4. 기존 사용자 식별자(identity) 검증 — C2 account takeover 방지.
    //    다른 provider(예: email/google/kakao)로 이미 가입된 이메일에 Naver 매직 링크를
    //    발급하면 그 계정으로 강제 로그인 → 인계 가능. 따라서 기존 user에
    //    `provider='naver'` identity가 없으면 가입 차단.
    const lookup = await findUserByEmail(naverUser.email);
    if (lookup.error) {
      // REST 호출 실패 시 fail-closed.
      return redirectLoginWithCookieCleanup(url.origin, 'server_error');
    }
    if (lookup.user) {
      // admin.generateLink 는 identities[].provider 를 'email' 로 세팅하므로
      // app_metadata.providers / app_metadata.provider 까지 확인해야 Naver 로그인
      // 재진입 시 본인을 잘못 차단하지 않는다 (재로그인 lockout 회귀 방지).
      //
      // 2026-05-26: 추가 — user_metadata.provider 도 검증. 첫 가입 시 우리
      // callback 의 updateUserById (app_metadata.provider='naver') 가 Supabase
      // verify 단계에서 'email' 로 reset 되는 케이스 관측 (deltavlrt7@naver.com).
      // user_metadata.provider 는 generateLink 의 options.data 가 박는 값이며
      // verify 후에도 유지됨. takeover 우려 (다른 provider 사용자가 user_metadata
      // 수정 후 Naver 로그인) 가 있지만 일반 사용자 API 로 본인 metadata 만
      // 수정 가능 + attacker 가 victim 의 account 접근 못 함 → 시나리오 어려움.
      // 정공법 (identities 'naver' row 직접 insert) 는 별도 의사결정.
      const identities = lookup.user.identities ?? [];
      const appMeta = lookup.user.app_metadata ?? {};
      const userMeta = lookup.user.user_metadata ?? {};
      const naverLinked =
        identities.some((i) => i.provider === 'naver') ||
        (Array.isArray(appMeta.providers) && appMeta.providers.includes('naver')) ||
        appMeta.provider === 'naver' ||
        userMeta.provider === 'naver';
      if (!naverLinked) {
        // 로그에는 user.id 만 — email/provider 목록은 로그 분석자에게 가입 사실을 노출하므로 제외.
        console.error(
          '[naver/callback] account-takeover blocked — userId=%s',
          lookup.user.id,
        );
        return redirectLoginWithCookieCleanup(
          url.origin,
          'already_registered_other_provider',
        );
      }
    }

    // 5. Supabase admin: 사용자 upsert + magic link 발급
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
      console.error('[naver/callback] generateLink failed');
      return redirectLoginWithCookieCleanup(url.origin, 'server_error');
    }

    // 6. app_metadata에 provider=naver 박기. Supabase native OAuth는 자동으로
    //    identities + app_metadata에 박는데, admin.generateLink는 email로 분류함.
    //    Dashboard Users의 Providers 컬럼이 app_metadata.provider 기반이라 명시 설정.
    const userId = linkData.user?.id;
    if (userId) {
      await admin.auth.admin.updateUserById(userId, {
        app_metadata: {
          provider: 'naver',
          providers: ['naver'],
        },
      });

      // 6b. oauth_tokens 보관 — 회원탈퇴 시 Naver delete API 호출용
      //     ([[project_naver_auto_relogin_followup]] layer 2 자동화).
      //     service role admin client 라 RLS 우회. expires_at 으로 token 유효성
      //     판단해 만료 시 refresh_token 으로 재발급 가능.
      //     실패해도 로그인 흐름 진행 (best-effort).
      try {
        const expiresAt = tokenData.expires_in
          ? new Date(Date.now() + parseInt(tokenData.expires_in, 10) * 1000)
          : null;
        const { error: tokenStoreError } = await admin
          .from('oauth_tokens')
          .upsert(
            {
              user_id: userId,
              provider: 'naver',
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token ?? null,
              expires_at: expiresAt?.toISOString() ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,provider' },
          );
        if (tokenStoreError) {
          // 로그인 흐름은 계속 진행. revoke 자동화만 영향.
          console.error('[naver/callback] oauth_tokens upsert error:', tokenStoreError);
        }
      } catch (e) {
        console.error('[naver/callback] oauth_tokens upsert exception:', e);
      }
    }

    // 7. magic link로 redirect → Supabase verify + fragment에 token → /auth/finish
    const response = NextResponse.redirect(linkData.properties.action_link);
    response.cookies.delete(NAVER_STATE_COOKIE);
    return response;
  } catch (e) {
    console.error('[naver/callback] unexpected error:', e);
    return redirectLoginWithCookieCleanup(url.origin, 'server_error');
  }
}
