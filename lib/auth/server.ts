// Server-side auth/plan 헬퍼. Server Components / Route Handlers / Server Actions에서 공통 사용.
// premium 게이트는 plan='premium' AND premium_until > now() 모두 충족해야 함 (P4-D2).
// 만료된 premium 사용자가 무한정 유료 기능을 쓰지 못하도록.

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type Plan = 'free' | 'premium';

export interface ProfileRow {
  plan: Plan;
  premium_until: string | null;
}

export interface PremiumGuardOk {
  ok: true;
  userId: string;
  profile: ProfileRow;
}

export interface PremiumGuardErr {
  ok: false;
  reason: 'unauthenticated' | 'not_premium' | 'expired';
  error: string;
}

export type PremiumGuard = PremiumGuardOk | PremiumGuardErr;

// 현재 user의 plan을 결정. 미로그인이거나 profile 없으면 'free'.
// premium_until이 과거이면 effective plan은 'free'로 강등.
export async function getEffectivePlan(): Promise<Plan> {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 'free';
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, premium_until')
      .eq('id', user.id)
      .maybeSingle<ProfileRow>();
    return isPremiumActive(profile) ? 'premium' : 'free';
  } catch (e) {
    console.error('[getEffectivePlan] error:', e);
    return 'free';
  }
}

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
export async function requirePremium(featureLabel?: string): Promise<PremiumGuard> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: 'unauthenticated', error: '로그인이 필요합니다.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, premium_until')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

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

  return { ok: true, userId: user.id, profile };
}
