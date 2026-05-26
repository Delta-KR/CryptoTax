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
const MAX_AGE_SEC = 600; // 10분 — magic link 도착 충분, stale 회피.

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
 * `/auth/finish` server component 에서 1회용 검증.
 * cookie 존재하면 즉시 삭제 후 반환 — 재사용 차단.
 */
export async function consumeFinishNonce(): Promise<string | null> {
  const store = await cookies();
  const v = store.get(FINISH_NONCE_COOKIE)?.value ?? null;
  if (v) {
    store.delete(FINISH_NONCE_COOKIE);
  }
  return v;
}
