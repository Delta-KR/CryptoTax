import { redirect } from 'next/navigation';
import {
  consumeFinishNonce,
  extractNonce,
  verifyFinishToken,
} from '@/lib/auth/finish-nonce';
import { FinishClient } from './FinishClient';

// audit security P1-6: /auth/finish 는 fragment 의 access_token 만으로 setSession
// 하므로, legitimate flow 인지 검증 없이는 공격자가 victim 한테
// kontaxt.kr/auth/finish#access_token=ATTACKER_TOKEN phishing link 를 보내
// session fixation 이 가능하다.
//
// 방어: Naver callback 이 발급한 HMAC 서명 nonce(`?fn=...`)를 server 에서 검증.
// 공격자는 AUTH_FINISH_NONCE_SECRET 을 몰라 유효 fn 을 위조할 수 없다. cookie 가
// 아니라 query 라서 Naver→supabase.co→kontaxt.kr cross-site chain 에서도 유실되지
// 않는다 (PR #72 cookie 방식이 깨진 원인 회피).
//
// fragment(access_token)는 server 에 전송되지 않으므로 검증 통과 후 client
// 컴포넌트(FinishClient)가 setSession 을 수행한다.
export default async function AuthFinishPage({
  searchParams,
}: {
  searchParams: Promise<{ fn?: string }>;
}) {
  const { fn } = await searchParams;
  if (!verifyFinishToken(fn ?? null)) {
    redirect('/login?error=invalid_request');
  }
  // single-use: 유효한 fn 이라도 1회만 통과시킨다. 이미 소비된 fn(=relay/replay)은 거부 —
  // login-CSRF / session fixation 차단 (CSO 감사 2026-05-29). 'store_unavailable'(Redis
  // 미설정·오류)은 fail-open: HMAC 서명+만료 검증으로만 통과 (login 가용성 우선).
  const nonce = extractNonce(fn ?? null);
  if (nonce && (await consumeFinishNonce(nonce)) === 'replayed') {
    redirect('/login?error=invalid_request');
  }
  return <FinishClient />;
}
