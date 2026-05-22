'use server';

// 시행령 §88④⑤ — 필요경비 의제 50%. 사용자가 코인 단위로 적용 토글.
// 적용 시 그 코인 전체 매도가액의 50%를 필요경비로 의제 (부대비용 불인정).
// Premium 전용 — 의제취득가액과 동일한 fallback 영역이므로 유료 기능으로 묶음.

import { createSupabaseServerClient } from '@/lib/supabase/server';

const COIN_PATTERN = /^[A-Z0-9_-]{1,16}$/;

interface ActionResult {
  ok: boolean;
  error?: string;
}

async function ensurePremium(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: '로그인이 필요합니다.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle<{ plan: 'free' | 'premium' }>();

  if (profile?.plan !== 'premium') {
    return {
      ok: false,
      error: '필요경비 의제 적용은 프리미엄 전용 기능입니다.',
    };
  }
  return { ok: true, userId: user.id };
}

export async function saveImputedExpenseCoin(
  coin: string,
): Promise<ActionResult> {
  try {
    if (typeof coin !== 'string' || !COIN_PATTERN.test(coin)) {
      return { ok: false, error: '코인 형식이 올바르지 않습니다.' };
    }

    const guard = await ensurePremium();
    if (!guard.ok) return { ok: false, error: guard.error };

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from('user_imputed_expense_coins').upsert(
      { user_id: guard.userId, coin },
      { onConflict: 'user_id,coin' },
    );

    if (error) {
      console.error('[saveImputedExpenseCoin] error:', error);
      return { ok: false, error: '저장 중 오류가 발생했습니다.' };
    }
    return { ok: true };
  } catch (e) {
    console.error('[saveImputedExpenseCoin] unexpected:', e);
    return { ok: false, error: '예기치 못한 오류 — 새로고침 후 다시 시도해주세요.' };
  }
}

export async function deleteImputedExpenseCoin(
  coin: string,
): Promise<ActionResult> {
  try {
    if (typeof coin !== 'string' || !COIN_PATTERN.test(coin)) {
      return { ok: false, error: '코인 형식이 올바르지 않습니다.' };
    }

    const guard = await ensurePremium();
    if (!guard.ok) return { ok: false, error: guard.error };

    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from('user_imputed_expense_coins')
      .delete()
      .eq('user_id', guard.userId)
      .eq('coin', coin);

    if (error) {
      console.error('[deleteImputedExpenseCoin] error:', error);
      return { ok: false, error: '삭제 중 오류가 발생했습니다.' };
    }
    return { ok: true };
  } catch (e) {
    console.error('[deleteImputedExpenseCoin] unexpected:', e);
    return { ok: false, error: '예기치 못한 오류 — 새로고침 후 다시 시도해주세요.' };
  }
}
