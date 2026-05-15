'use server';

import { redirect } from 'next/navigation';
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '@/lib/supabase/server';
import { isPasswordValid } from '@/lib/auth/password-rules';

export type ChangePasswordCode =
  | 'oauth_only'
  | 'wrong_password'
  | 'weak'
  | 'missing_email'
  | 'unauthenticated'
  | 'unknown';

export interface ChangePasswordResult {
  ok: boolean;
  error?: string;
  code?: ChangePasswordCode;
}

export async function changePassword(input: {
  oldPassword: string;
  newPassword: string;
}): Promise<ChangePasswordResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.', code: 'unauthenticated' };
  }
  const email = user.email;
  if (!email) {
    return {
      ok: false,
      error: '이메일이 없는 계정은 비밀번호 변경을 지원하지 않습니다.',
      code: 'missing_email',
    };
  }
  const providers = user.app_metadata?.providers as string[] | undefined;
  const hasEmailProvider =
    providers?.includes('email') ??
    user.identities?.some((i) => i.provider === 'email') ??
    false;
  if (!hasEmailProvider) {
    return {
      ok: false,
      error: '소셜 로그인 계정은 비밀번호 변경을 지원하지 않습니다.',
      code: 'oauth_only',
    };
  }
  if (!isPasswordValid(input.newPassword)) {
    return {
      ok: false,
      error: '새 비밀번호가 조건을 충족하지 않습니다.',
      code: 'weak',
    };
  }

  // Re-auth로 기존 비밀번호 검증. signInWithPassword가 성공하면 세션이 refresh됨.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: input.oldPassword,
  });
  if (reauthError) {
    return {
      ok: false,
      error: '기존 비밀번호가 일치하지 않습니다.',
      code: 'wrong_password',
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  });
  if (updateError) {
    return {
      ok: false,
      error: updateError.message,
      code: 'unknown',
    };
  }
  return { ok: true };
}

export async function updateDisplayName(
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 50) {
    return { ok: false, error: '이름은 1~50자 사이여야 합니다.' };
  }
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' };
  }
  const { error } = await supabase.auth.updateUser({
    data: { name: trimmed },
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteAccount(): Promise<{
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
  const userId = user.id;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error('[deleteAccount] admin client init failed:', e);
    return {
      ok: false,
      error: '계정 삭제 기능을 사용할 수 없습니다. 관리자에게 문의해주세요.',
    };
  }

  // 1) profiles row 명시적 삭제 (cascade 미설정에 대한 방어). 실패해도 진행.
  try {
    const { error: profileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) {
      console.error('[deleteAccount] profiles delete error:', profileError);
    }
  } catch (e) {
    console.error('[deleteAccount] profiles delete exception:', e);
  }

  // 2) 쿠키 정리. admin.deleteUser 후에는 세션이 무효이므로 먼저 sign out.
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error('[deleteAccount] signOut error:', e);
  }

  // 3) auth.users 삭제.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('[deleteAccount] admin.deleteUser error:', deleteError);
    return { ok: false, error: deleteError.message };
  }

  redirect('/');
}
