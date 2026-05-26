import { redirect } from 'next/navigation';
import { consumeFinishNonce } from '@/lib/auth/finish-nonce';
import { FinishClient } from './FinishClient';

// audit security P1-6 (2026-05-23): /auth/finish 가 cookie 의 nonce 1회용
// 검증을 통과해야만 client setSession 단계로 진행. legitimate flow
// (Naver callback 등) 에서만 nonce cookie 가 발급되므로 phishing link
// (예: kontaxt.kr/auth/finish#access_token=ATTACKER_TOKEN) 직격 시 reject.
export default async function AuthFinishPage() {
  const nonce = await consumeFinishNonce();
  if (!nonce) {
    redirect('/login?error=invalid_request');
  }
  return <FinishClient />;
}
