'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function upgradePlan(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' };
  }
  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'premium' })
    .eq('id', user.id);
  if (error) {
    console.error('[upgradePlan] error:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function downgradePlan(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' };
  }
  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', user.id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
