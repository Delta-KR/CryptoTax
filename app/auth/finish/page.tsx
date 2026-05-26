import { redirect } from 'next/navigation';
import { hasFinishNonce } from '@/lib/auth/finish-nonce';
import { FinishClient } from './FinishClient';

// audit security P1-6 (2026-05-23): /auth/finish 가 cookie 의 nonce 검증을
// 통과해야만 client setSession 단계로 진행. legitimate flow (Naver callback)
// 에서만 nonce cookie 가 발급되므로 phishing link
// (예: kontaxt.kr/auth/finish#access_token=ATTACKER_TOKEN) 직격 시 reject.
//
// Server component 는 cookies().delete() 가 작동 안 함 (RSC read-only) →
// 여기선 존재만 sniff 하고, 실제 1회용 consume + delete 는 FinishClient 가
// server action 으로 setSession 직전에 실행 (race window 최소화).
export default async function AuthFinishPage() {
  if (!(await hasFinishNonce())) {
    redirect('/login?error=invalid_request');
  }
  return <FinishClient />;
}
