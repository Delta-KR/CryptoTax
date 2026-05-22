'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { safeNext } from '@/lib/auth/safe-next';

export type Plan = 'free' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: Plan;
}

interface SessionUser {
  id: string;
  email?: string | null;
  user_metadata?: { name?: string };
}

async function buildUser(sessionUser: SessionUser): Promise<User> {
  const supabase = createSupabaseBrowserClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, premium_until')
    .eq('id', sessionUser.id)
    .maybeSingle<{ plan: Plan; premium_until: string | null }>();
  const email = sessionUser.email ?? '';
  // 만료된 premium은 client UI에서도 free로 강등 — 서버의 requirePremium과 일관.
  // premium_until=null은 legacy/관리자 grant로 무기한 처리.
  let effectivePlan: Plan = profile?.plan ?? 'free';
  if (effectivePlan === 'premium' && profile?.premium_until) {
    const until = new Date(profile.premium_until);
    if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) {
      effectivePlan = 'free';
    }
  }
  return {
    id: sessionUser.id,
    email,
    name:
      sessionUser.user_metadata?.name ??
      email.split('@')[0] ??
      '사용자',
    plan: effectivePlan,
  };
}

export function useCurrentUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function refresh(sessionUser: SessionUser | undefined | null) {
      if (!sessionUser) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      const next = await buildUser(sessionUser);
      if (!cancelled) {
        setUser(next);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      refresh(data.session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      refresh(session?.user);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export async function signInWithPassword(
  email: string,
  password: string,
  captchaToken?: string,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  });
  if (error) throw new Error(translateSupabaseError(error.message));
}

export async function signUpWithPassword(
  email: string,
  password: string,
  name?: string,
  captchaToken?: string,
): Promise<{ needsEmailConfirmation: boolean }> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { name } : undefined,
      captchaToken: captchaToken || undefined,
    },
  });
  if (error) throw new Error(translateSupabaseError(error.message));
  return {
    needsEmailConfirmation: !data.session && !!data.user,
  };
}

export async function resetPasswordForEmail(
  email: string,
  captchaToken?: string,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined,
    captchaToken: captchaToken || undefined,
  });
  if (error) throw new Error(translateSupabaseError(error.message));
}

// 비번 재설정 메일 링크 클릭 후 reset-password 페이지에서 새 비밀번호 저장.
// 호출 시점에 Supabase recovery 세션이 활성화돼 있어야 함.
export async function updateUserPassword(newPassword: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(translateSupabaseError(error.message));
}

export async function signOut(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
}

// 이메일+비번 provider가 연결돼 있는지. OAuth-only 계정에는 비밀번호 변경을 노출하지 않기 위한 가드.
export function hasEmailIdentity(user: {
  identities?: Array<{ provider?: string }> | null;
  app_metadata?: { providers?: string[] } | null;
}): boolean {
  const providers =
    user.identities?.map((i) => i.provider).filter(Boolean) ??
    user.app_metadata?.providers ??
    [];
  return providers.includes('email');
}

export type OAuthProvider = 'google' | 'kakao';

export async function signInWithOAuth(
  provider: OAuthProvider,
  options?: { nextUrl?: string },
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const validatedNext = options?.nextUrl ? safeNext(options.nextUrl) : null;
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback${validatedNext ? `?next=${encodeURIComponent(validatedNext)}` : ''}`
      : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) throw new Error(translateSupabaseError(error.message));
}

function translateSupabaseError(msg: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 일치하지 않습니다.',
    'User already registered': '이미 가입된 이메일입니다.',
    'Password should be at least 6 characters':
      '비밀번호는 6자 이상이어야 합니다.',
    'Email not confirmed':
      '이메일 인증이 완료되지 않았습니다. 받은 이메일에서 인증 링크를 클릭해주세요.',
    'For security purposes, you can only request this after':
      '잠시 후 다시 시도해주세요.',
    'captcha verification process failed':
      '보안 검증에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.',
    'captcha protection': '보안 검증이 필요합니다. 잠시 후 다시 시도해주세요.',
    'Password should contain at least one character':
      '비밀번호에 영문 대/소문자, 숫자를 모두 포함해야 합니다.',
  };
  for (const key of Object.keys(map)) {
    if (msg.includes(key)) return map[key];
  }
  return msg;
}
