'use server';

/**
 * Server-side session 백업 — single JSONB blob per user.
 *
 * 배경: 거래 데이터가 그동안 localStorage 만 보관 → cross-device 불가 + 결제
 * 영수증 trust anchor 부재. CEO review (subagent) 의 counter-plan 으로 단일
 * blob 백업 채택. relational transactions table 은 Phase 7 launch + 50+
 * paying users 후 access pattern 보고 결정.
 *
 * 호출 시점:
 *   - loadSnapshot: 로그인 직후 (useCurrentUser refresh) — server → localStorage 동기
 *   - saveSnapshot: saveSession 후 fire-and-forget — localStorage → server 백업
 *
 * 동시성: last-write-wins (updated_at 비교 없음). 솔로 사용자 + 단일 디바이스
 * 시나리오에선 충분. 추후 멀티 디바이스 동시 편집이 흔해지면 conflict
 * resolution 고려.
 */

import { sessionSchema, type SessionData } from '@/lib/storage/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface SnapshotSaveResult {
  ok: boolean;
  error?: string;
}

export interface SnapshotLoadResult {
  ok: boolean;
  payload?: SessionData;
  updatedAt?: string;
  error?: string;
}

export async function saveSnapshot(
  payload: SessionData,
): Promise<SnapshotSaveResult> {
  const validated = sessionSchema.safeParse(payload);
  if (!validated.success) {
    return { ok: false, error: 'invalid payload (schema mismatch)' };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'not authenticated' };
  }

  const { error } = await supabase.from('user_data').upsert(
    {
      user_id: user.id,
      payload: validated.data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('[saveSnapshot] supabase error:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function loadSnapshot(): Promise<SnapshotLoadResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'not authenticated' };
  }

  const { data, error } = await supabase
    .from('user_data')
    .select('payload, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[loadSnapshot] supabase error:', error.message);
    return { ok: false, error: error.message };
  }
  if (!data?.payload) {
    return { ok: true };
  }

  // payload 가 외부에서 손상됐을 가능성 (사용자가 Supabase 콘솔로 직접 수정 등).
  // server-side 도 schema validate 로 corrupted 데이터를 무력화.
  const validated = sessionSchema.safeParse(data.payload);
  if (!validated.success) {
    return { ok: false, error: 'stored payload corrupted' };
  }

  return {
    ok: true,
    payload: validated.data as unknown as SessionData,
    updatedAt: data.updated_at,
  };
}
