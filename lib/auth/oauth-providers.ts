// OAuth provider 식별 — server action / client 양쪽에서 공유 (no React, no 'use client').
//
// Wave 1 사후 review (PR #80~#84) 후속 — server changePassword (account.ts) 와
// client hasEmailIdentity check 가 sync 안 됐던 drift 해소. 단일 source 로 분리.

// 신뢰 source for OAuth-only 사용자 판별. signInWithOAuth 의 OAuthProvider 타입
// ('google'|'kakao') 와는 비대칭 — Naver 는 자체 flow (Supabase native X) 라 type
// 에 없지만 가입 후 user 의 metadata 에는 'naver' 박힘. 따라서 이 list 가 진짜
// OAuth-only signal source. 신규 provider 추가 시 이 list 도 갱신 필요.
export const OAUTH_PROVIDERS = ['naver', 'google', 'kakao'] as const;

/**
 * 이메일+비번 provider 가 연결돼 있는지. OAuth-only 계정에는 비밀번호 변경 (또는
 * password reset) 을 노출/허용하지 않기 위한 가드.
 *
 * admin.generateLink 가 Naver 가입자에게 identities='email' fake row 박는 한계
 * (Supabase 자체 design) 가 있어서 단순 identities check 만으로는 OAuth-only
 * 사용자 식별 불가 → app_metadata.provider / user_metadata.provider 의 OAuth
 * provider 우선 검증.
 */
export function hasEmailIdentity(user: {
  identities?: Array<{ provider?: string }> | null;
  app_metadata?: { providers?: string[]; provider?: string } | null;
  user_metadata?: { provider?: string } | null;
}): boolean {
  const appProvider = user.app_metadata?.provider;
  const userProvider = user.user_metadata?.provider;
  if (appProvider && (OAUTH_PROVIDERS as readonly string[]).includes(appProvider)) {
    return false;
  }
  if (userProvider && (OAUTH_PROVIDERS as readonly string[]).includes(userProvider)) {
    return false;
  }
  const providers =
    user.identities?.map((i) => i.provider).filter(Boolean) ??
    user.app_metadata?.providers ??
    [];
  return providers.includes('email');
}
