import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';

/**
 * `/auth/finish` 도착 검증용 nonce.
 *
 * audit security P1-6 (2026-05-23): 이전엔 `/auth/finish` 가 fragment 의
 * access_token 만으로 supabase.setSession 호출 → 공격자가 victim 한테
 * `kontaxt.kr/auth/finish#access_token=ATTACKER_TOKEN` phishing link 보내면
 * victim 이 attacker 계정으로 로그인됨 (victim 데이터 → attacker 계정 적재).
 *
 * 방어: legitimate flow (Naver callback 등) 에서 nonce httpOnly cookie 발급 →
 * `/auth/finish` server component 가 cookie 존재 검증 + 1회용 consume.
 * phishing link 만 따라간 victim 은 cookie 가 없어서 reject 됨.
 */
export const FINISH_NONCE_COOKIE = 'auth_finish_nonce';
// 60초 — Naver OAuth → Supabase verify → /auth/finish 정상 흐름은 2-5초.
// 1분 maxAge 면 99% 사용자 보호 + stale phishing window 최소화.
// audit Wave 1 (PR #72): 10분이면 victim 의 미완료 flow nonce 가 attacker
// phishing fragment 와 함께 통과될 수 있는 window 가 너무 큼 — 1/10 로 축소.
//
// HMAC binding (nonce ↔ token cryptographic) 은 별도 의사결정 PR — Supabase
// generateLink 시점에 access_token 미발급 (callback 이 token 모름) 이라 직접
// binding 어려움. URL query nonce 박는 alternative 는 Supabase verify 의 query
// 보존 동작 확인 필요 (prod risky).
const MAX_AGE_SEC = 60;

export function generateFinishNonce(): string {
  return randomBytes(32).toString('hex');
}

export function buildNonceCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SEC,
  };
}

/**
 * Server component 에서 cookie 존재만 sniff (read-only context).
 * Next 15+ Server Component 는 cookies().delete() 가 작동 안 함 — 실제 1회용
 * consume 은 별도 server action 에서 (`app/auth/finish/actions.ts`).
 */
export async function hasFinishNonce(): Promise<boolean> {
  const store = await cookies();
  return store.has(FINISH_NONCE_COOKIE);
}
