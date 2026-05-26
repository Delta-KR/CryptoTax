'use client';
import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { safeNext } from '@/lib/auth/safe-next';
import {
  clearAllSessions,
  loadSession,
  saveSession,
  setSessionUser,
} from '@/lib/storage/session';
import { loadSnapshot, saveSnapshot } from '@/app/actions/user-data';

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
  // audit perf P1-1 후속: TOKEN_REFRESHED 같은 onAuthStateChange 이벤트가
  // refresh() 를 재호출할 때 같은 user.id 면 loadSnapshot 재실행 skip.
  // sign-out 시 reset 해서 다음 sign-in 에 다시 hydrate.
  const snapshotHydratedRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    async function refresh(sessionUser: SessionUser | undefined | null) {
      // localStorage 거래 데이터를 user_id 별로 격리. 같은 브라우저에서
      // 계정 전환 시 이전 사용자 데이터가 새 사용자에게 보이지 않도록.
      setSessionUser(sessionUser?.id ?? null);

      if (!sessionUser) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
          snapshotHydratedRef.current = null;
        }
        return;
      }

      // server-side snapshot 동기 — fire-and-forget. user.id 별 1회만
      // (token refresh 등 재발 이벤트 시 재실행 차단 — audit P1-1 후속).
      // - server payload 있으면 → localStorage 덮어쓰기 (다른 디바이스 변경 반영)
      // - server 비어있고 localStorage 있으면 → server 로 자동 백업
      //   (첫 로그인 마이그레이션 — server-side backup 도입 전 데이터 보존)
      if (snapshotHydratedRef.current !== sessionUser.id) {
        snapshotHydratedRef.current = sessionUser.id;
        void loadSnapshot()
        .then((result) => {
          if (cancelled) return;
          if (!result.ok) return;
          if (result.payload) {
            saveSession(result.payload, { skipServerSync: true });
          } else {
            // server 비어있음. localStorage 에 데이터 있으면 자동 백업.
            const local = loadSession();
            if (local && local.allUnified.length > 0) {
              void saveSnapshot(local).catch((err) => {
                console.warn('[useCurrentUser] initial backup failed:', err);
              });
            }
          }
        })
        .catch((err) => {
          console.warn('[useCurrentUser] snapshot load failed:', err);
        });
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
): Promise<{
  needsEmailConfirmation: boolean;
  alreadyRegistered: boolean;
}> {
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

  // Supabase는 이미 confirmed된 이메일로 signUp 시 user.identities를 빈 배열로 반환.
  // (보안 패턴 — 명시적 에러 대신 응답 구조로 신호)
  // 우리는 한국 사용자 친화 UX를 위해 이를 감지해 "이미 가입됨" 안내로 분기.
  const alreadyRegistered =
    !!data.user && (data.user.identities?.length ?? 0) === 0;

  return {
    needsEmailConfirmation:
      !data.session && !!data.user && !alreadyRegistered,
    alreadyRegistered,
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
  // 모든 user 키 + anon 키 정리 — 다음 사용자가 공용 PC 등에서 이전
  // 데이터를 보지 않도록.
  clearAllSessions();
  setSessionUser(null);
  await supabase.auth.signOut();
}

// 이메일+비번 provider가 연결돼 있는지. OAuth-only 계정에는 비밀번호 변경을 노출하지 않기 위한 가드.
//
// 2026-05-26 fix: Naver 가입자는 admin.generateLink 결과 identities='email' 가
// 박혀서 단순 identities check 만으로는 이메일 가입자로 잘못 분류됨 → 비번 변경
// 카드 노출되는 UX bug. app_metadata.provider / user_metadata.provider 가 OAuth
// provider 면 우선 false 반환.
const OAUTH_PROVIDERS = ['naver', 'google', 'kakao'];

export function hasEmailIdentity(user: {
  identities?: Array<{ provider?: string }> | null;
  app_metadata?: { providers?: string[]; provider?: string } | null;
  user_metadata?: { provider?: string } | null;
}): boolean {
  const appProvider = user.app_metadata?.provider;
  const userProvider = user.user_metadata?.provider;
  // OAuth-only 사용자 (Naver/Google/Kakao 단독 가입) — generateLink 가 fake email
  // identity 박은 경우 포함. app_metadata 또는 user_metadata 의 provider 우선.
  if (appProvider && OAUTH_PROVIDERS.includes(appProvider)) return false;
  if (userProvider && OAUTH_PROVIDERS.includes(userProvider)) return false;

  // 그 외 — identities 의 'email' 확인 (email+OAuth multi-identity 케이스 포함).
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
