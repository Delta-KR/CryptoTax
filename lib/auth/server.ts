// Server-side auth/plan 헬퍼. Server Components / Route Handlers / Server Actions에서 공통 사용.
// premium 게이트는 plan='premium' AND premium_until > now() 모두 충족해야 함 (P4-D2).
// 만료된 premium 사용자가 무한정 유료 기능을 쓰지 못하도록.
//
// per-request 캐싱 (React.cache): 같은 요청 안에서 getAuthedUser/getUserProfile 가
// N번 호출돼도 Supabase 왕복은 각 1회. Server Action 단일 호출에서도 rate-limit
// identifier + plan 조회 + premium guard 가 같은 user 데이터를 공유하면서
// auth.getUser() 가 2~3회 발생하던 문제 해소.

import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type Plan = 'free' | 'premium';

export interface ProfileRow {
  plan: Plan;
  premium_until: string | null;
}

export interface PremiumGuardOk {
  ok: true;
  userId: string;
  // 표시용 — 호출자가 한 번 더 getUser 호출하지 않도록 미리 도출. user_metadata
  // 원본을 통째로 노출하면 leaky abstraction 이라 필요한 표시명만 추출.
  userName: string;
  profile: ProfileRow;
}

export interface PremiumGuardErr {
  ok: false;
  reason: 'unauthenticated' | 'not_premium' | 'expired';
  error: string;
}

export type PremiumGuard = PremiumGuardOk | PremiumGuardErr;

// 인증된 user 조회 (per-request 캐싱). 실패/미로그인 시 null.
// React.cache 의 인자 비교는 Object.is — 인자 없으니 항상 cache hit.
export const getAuthedUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (e) {
    console.error('[getAuthedUser] error:', e);
    return null;
  }
});

// Profile 조회 (per-request, userId 별 dedup). primitive 인자라 cache hit 안전.
const getUserProfile = cache(async (userId: string): Promise<ProfileRow | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('profiles')
      .select('plan, premium_until')
      .eq('id', userId)
      .maybeSingle<ProfileRow>();
    return data ?? null;
  } catch (e) {
    console.error('[getUserProfile] error:', e);
    return null;
  }
});

// 현재 user의 plan을 결정. 미로그인이거나 profile 없으면 'free'.
// premium_until이 과거이면 effective plan은 'free'로 강등.
export const getEffectivePlan = cache(async (): Promise<Plan> => {
  const user = await getAuthedUser();
  if (!user) return 'free';
  const profile = await getUserProfile(user.id);
  return isPremiumActive(profile) ? 'premium' : 'free';
});

// profile이 현재 시각 기준으로 premium 활성 상태인지.
// premium_until이 null이면 무기한(legacy/manual seed) — premium으로 인정.
// 명시적 만료일이 있고 그 시각이 지났으면 premium 아님.
export function isPremiumActive(
  profile: Pick<ProfileRow, 'plan' | 'premium_until'> | null | undefined,
): boolean {
  if (!profile) return false;
  if (profile.plan !== 'premium') return false;
  if (profile.premium_until === null) {
    // legacy: 만료일 없는 premium은 유지 (관리자 수동 grant 케이스).
    return true;
  }
  const until = new Date(profile.premium_until);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() > Date.now();
}

// premium 전용 기능 진입 가드. 로그인+premium+미만료 모두 통과해야 OK.
// 호출 측은 ok=false일 때 reason으로 분기하거나 error 메시지 그대로 노출.
// getAuthedUser / getUserProfile 가 per-request 캐시되므로 같은 요청 안에서
// getEffectivePlan + requirePremium 동시 호출돼도 Supabase 왕복은 각 1회.
export async function requirePremium(featureLabel?: string): Promise<PremiumGuard> {
  const user = await getAuthedUser();
  if (!user) {
    return { ok: false, reason: 'unauthenticated', error: '로그인이 필요합니다.' };
  }

  const profile = await getUserProfile(user.id);

  if (!profile || profile.plan !== 'premium') {
    return {
      ok: false,
      reason: 'not_premium',
      error: featureLabel
        ? `${featureLabel}은 프리미엄 전용 기능입니다.`
        : '프리미엄 전용 기능입니다.',
    };
  }

  if (!isPremiumActive(profile)) {
    return {
      ok: false,
      reason: 'expired',
      error: '프리미엄 구독이 만료되었습니다. 구독을 갱신해주세요.',
    };
  }

  const metaName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined);
  const userName = metaName ?? user.email?.split('@')[0] ?? '사용자';

  return {
    ok: true,
    userId: user.id,
    userName,
    profile,
  };
}
