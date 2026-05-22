'use server';

// 사용자 의제취득가액 매뉴얼 입력 (v2 #3). Premium 전용.
// 자동 적재 데이터(글로벌 deemed_cost_snapshots)가 미존재이거나 사용자가 부정확하다고
// 판단할 때 fallback으로 사용. 저장된 override는 본인에게만 적용 (RLS).

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePremium } from '@/lib/auth/server';

const DEEMED_DATE = '2026-12-31';
const MAX_PRICE_KRW = 1e12; // 1조원 — 어떤 코인 단가도 이를 넘을 수 없음.
const COIN_PATTERN = /^[A-Z0-9_-]{1,16}$/;

interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function saveUserDeemedCostOverride(
  coin: string,
  priceKRW: number,
): Promise<ActionResult> {
  try {
    if (typeof coin !== 'string' || !COIN_PATTERN.test(coin)) {
      return { ok: false, error: '코인 형식이 올바르지 않습니다.' };
    }
    if (
      typeof priceKRW !== 'number' ||
      !Number.isFinite(priceKRW) ||
      priceKRW <= 0 ||
      priceKRW > MAX_PRICE_KRW
    ) {
      return {
        ok: false,
        error: '가격은 0보다 크고 1조원 이하여야 합니다.',
      };
    }

    const guard = await requirePremium('의제취득가액 매뉴얼 입력');
    if (!guard.ok) return { ok: false, error: guard.error };

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from('user_deemed_cost_overrides').upsert(
      {
        user_id: guard.userId,
        coin,
        deemed_date: DEEMED_DATE,
        price_krw: priceKRW,
      },
      { onConflict: 'user_id,coin,deemed_date' },
    );

    if (error) {
      console.error('[saveUserDeemedCostOverride] error:', error);
      return { ok: false, error: '저장 중 오류가 발생했습니다.' };
    }
    return { ok: true };
  } catch (e) {
    console.error('[saveUserDeemedCostOverride] unexpected:', e);
    return { ok: false, error: '예기치 못한 오류 — 새로고침 후 다시 시도해주세요.' };
  }
}

export async function deleteUserDeemedCostOverride(
  coin: string,
): Promise<ActionResult> {
  try {
    if (typeof coin !== 'string' || !COIN_PATTERN.test(coin)) {
      return { ok: false, error: '코인 형식이 올바르지 않습니다.' };
    }

    const guard = await requirePremium('의제취득가액 매뉴얼 입력');
    if (!guard.ok) return { ok: false, error: guard.error };

    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from('user_deemed_cost_overrides')
      .delete()
      .eq('user_id', guard.userId)
      .eq('coin', coin)
      .eq('deemed_date', DEEMED_DATE);

    if (error) {
      console.error('[deleteUserDeemedCostOverride] error:', error);
      return { ok: false, error: '삭제 중 오류가 발생했습니다.' };
    }
    return { ok: true };
  } catch (e) {
    console.error('[deleteUserDeemedCostOverride] unexpected:', e);
    return { ok: false, error: '예기치 못한 오류 — 새로고침 후 다시 시도해주세요.' };
  }
}
