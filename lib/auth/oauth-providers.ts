// OAuth provider 식별 — server action / client 양쪽에서 공유 (no React, no 'use client').
//
// Wave 1 사후 review (PR #80~#84) 후속 — server changePassword (account.ts) 와
// client hasEmailIdentity check 가 sync 안 됐던 drift 해소. 단일 source 로 분리.

// 신뢰 source for OAuth-only 사용자 판별. signInWithOAuth 의 OAuthProvider 타입
// ('google'|'kakao') 와는 비대칭 — Naver 는 자체 flow (Supabase native X) 라 type
// 에 없지만 가입 후 user 의 metadata 에는 'naver' 박힘. 따라서 이 list 가 진짜
// OAuth-only signal source. 신규 provider 추가 시 이 list 도 갱신 필요.
export const OAUTH_PROVIDERS = ['naver', 'google', 'kakao'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/** OAuth user shape — Supabase auth.user 의 4 metadata source 통합. */
type OAuthUser = {
  identities?: Array<{ provider?: string }> | null;
  app_metadata?: { providers?: string[]; provider?: string } | null;
  user_metadata?: { provider?: string } | null;
};

/**
 * 특정 OAuth provider 가 사용자 계정에 연결돼 있는지. 4 source OR 검증:
 *
 * 1. `identities[].provider` — Supabase native OAuth (google/kakao) 가 박는 값
 * 2. `app_metadata.providers[]` — Supabase 가 다중 provider 시 박는 array
 * 3. `app_metadata.provider` — 우리 callback 의 admin.updateUserById 가 명시
 * 4. `user_metadata.provider` — admin.generateLink 의 options.data 가 박는 값
 *
 * 4 source 모두 검사하는 이유 — admin.generateLink 가 첫 가입자에게
 * `identities[].provider='email'` fake row 박는 Supabase design 한계 +
 * 2026-05-26 관측된 케이스 (callback 의 updateUserById app_metadata.provider 가
 * Supabase verify 단계에서 'email' 로 reset). 두 한계 모두 우회.
 *
 * 사용처:
 * - Naver callback `account-takeover blocked` 검증
 * - 향후 Google/Kakao 의 동일 패턴 (비즈앱 전환 후 custom callback 시)
 *
 * @see app/api/auth/naver/callback/route.ts (2026-05-26 cf. 주석)
 */
export function isProviderLinked(user: OAuthUser, provider: OAuthProvider): boolean {
  const identities = user.identities ?? [];
  const appMeta = user.app_metadata ?? {};
  const userMeta = user.user_metadata ?? {};
  return (
    identities.some((i) => i.provider === provider) ||
    (Array.isArray(appMeta.providers) && appMeta.providers.includes(provider)) ||
    appMeta.provider === provider ||
    userMeta.provider === provider
  );
}

/**
 * 이메일+비번 provider 가 연결돼 있는지. OAuth-only 계정에는 비밀번호 변경 (또는
 * password reset) 을 노출/허용하지 않기 위한 가드.
 *
 * `isProviderLinked` 와 대칭 — 이건 "어떤 OAuth provider 라도 박혀있으면 email
 * 아님" 판정. 단일 source (identities='email') 만 보면 OAuth-only 사용자가
 * admin.generateLink 거쳐 fake email identity 가진 케이스 misclassify.
 */
export function hasEmailIdentity(user: OAuthUser): boolean {
  // 어떤 OAuth provider 라도 박혀있으면 즉시 OAuth-only — email 아님.
  if (OAUTH_PROVIDERS.some((p) => isProviderLinked(user, p))) {
    return false;
  }
  // 마지막 fallback — identities 또는 app_metadata.providers 에 'email' 명시.
  const providers =
    user.identities?.map((i) => i.provider).filter(Boolean) ??
    user.app_metadata?.providers ??
    [];
  return providers.includes('email');
}
