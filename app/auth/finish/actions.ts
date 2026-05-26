'use server';

import { cookies } from 'next/headers';
import { FINISH_NONCE_COOKIE } from '@/lib/auth/finish-nonce';

/**
 * 1회용 nonce consume — server action 안에서만 cookies().delete() 보장.
 * Next 15+ Server Component 에서 .delete() 는 silently 무시 또는 throw.
 *
 * 호출 순서: server page (page.tsx) 가 hasFinishNonce() 로 1차 sniff →
 * 통과하면 FinishClient 렌더 → FinishClient 가 이 action 으로 2차 consume + delete.
 * 이 단계가 setSession 전에 실행돼야 stale nonce 가 phishing 에 재사용 안 됨.
 */
export async function consumeFinishNonceAction(): Promise<{
  ok: boolean;
}> {
  const store = await cookies();
  const v = store.get(FINISH_NONCE_COOKIE)?.value;
  if (!v) {
    return { ok: false };
  }
  store.delete(FINISH_NONCE_COOKIE);
  return { ok: true };
}
