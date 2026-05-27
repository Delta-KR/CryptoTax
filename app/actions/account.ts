'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from '@/lib/supabase/server';
import { findUserByEmail } from '@/lib/supabase/admin-lookup';
import { isPasswordValid } from '@/lib/auth/password-rules';
import { hasEmailIdentity } from '@/lib/auth/oauth-providers';
import { revokeNaverToken } from '@/lib/auth/oauth-revoke';
import {
  checkRateLimit,
  getAuthReauthRateLimit,
  getOAuthStartRateLimit,
} from '@/lib/rate-limit';

export type ChangePasswordCode =
  | 'oauth_only'
  | 'wrong_password'
  | 'weak'
  | 'missing_email'
  | 'unauthenticated'
  | 'captcha_failed'
  | 'rate_limited'
  | 'unknown';

export interface ChangePasswordResult {
  ok: boolean;
  error?: string;
  code?: ChangePasswordCode;
}

export async function changePassword(input: {
  oldPassword: string;
  newPassword: string;
  captchaToken?: string;
}): Promise<ChangePasswordResult> {
  const supabase = await createSupabaseServerClient();
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
  // Wave 1 사후 review (PR #80~#84) 후속 — server check 가 hasEmailIdentity helper
  // 와 sync 되도록 통합. 이전 inline check 는 OAUTH_PROVIDERS 우선 검증 누락 →
  // Naver 사용자의 raw_app_meta_data 가 어떤 이유로 'email' 으로 reset 된 케이스
  // (PR #83 root cause) 에서 server 가 비번 변경 허용했음 (signInWithPassword
  // re-auth 가 진짜 gate 라 immediate exploit 아니지만 sync 가치).
  if (!hasEmailIdentity(user)) {
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

  // P0: brute-force 방어. Turnstile 1회 해결로 무제한 추측 불가하도록 user.id 별 캡.
  // wait time 은 limiter 의 reset 으로 동적 도출 — limiter 변경 시 메시지 회귀 방지.
  const reauthLimit = await checkRateLimit(
    `reauth:${user.id}`,
    getAuthReauthRateLimit(),
  );
  if (!reauthLimit.ok) {
    const minutes = Math.max(
      1,
      Math.ceil((reauthLimit.reset - Date.now()) / 60_000),
    );
    return {
      ok: false,
      error: `비밀번호 시도가 너무 많습니다. ${minutes}분 후 다시 시도해주세요.`,
      code: 'rate_limited',
    };
  }

  // Re-auth로 기존 비밀번호 검증. signInWithPassword가 성공하면 세션이 refresh됨.
  // Supabase project에 captcha protection이 켜져 있으면 captchaToken 없이는
  // password grant가 전부 거부됨 → 사용자에게 "비번 불일치"로 보여 혼란 유발.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: input.oldPassword,
    options: input.captchaToken ? { captchaToken: input.captchaToken } : undefined,
  });
  if (reauthError) {
    const msg = (reauthError.message || '').toLowerCase();
    if (msg.includes('captcha')) {
      return {
        ok: false,
        error: '보안 검증에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.',
        code: 'captcha_failed',
      };
    }
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: '로그인이 필요합니다.' };
  }
  // Wave 1 사후 review LOW finding — Supabase auth.updateUser({data}) 는
  // shallow-merge. 여기서 'name' 만 명시 (다른 key 안 박힘). 미래에 이 호출에
  // 'provider' 같은 key 추가 절대 금지 — naverLinked check / hasEmailIdentity
  // 가 user_metadata.provider 를 신뢰 source 로 사용하므로 server 가 임의로
  // 덮으면 보안 effect (자기 OAuth-only flag 변경) 발생.
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
  const supabase = await createSupabaseServerClient();
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

  // 2) Naver OAuth 권한 revoke 시도 — best-effort.
  //    [[project_naver_auto_relogin_followup]] layer 2 자동화. 성공 시 다음
  //    로그인에 Naver consent 화면 다시 나옴 (자동 재로그인 X).
  //    실패해도 진행 — 사용자가 회원탈퇴 모달의 외부 link 로 직접 해제 가능.
  //    auth.users.deleteUser 가 oauth_tokens 도 cascade delete 하므로 순서가
  //    deleteUser 이전이어야 함.
  try {
    const { data: tokenRow, error: tokenLookupError } = await admin
      .from('oauth_tokens')
      .select('access_token, refresh_token, expires_at, provider')
      .eq('user_id', userId)
      .eq('provider', 'naver')
      .maybeSingle();
    if (tokenLookupError) {
      console.error('[deleteAccount] oauth_tokens lookup error:', tokenLookupError);
    } else if (tokenRow?.access_token) {
      // expires_at 전달 — Wave 1 사후 codex NIT (PR #101 review): 만료된
      // access_token 으로 1차 delete 호출 skip 하고 직접 refresh 분기로
      // (Naver API call 1회 절감).
      const expiresAt = tokenRow.expires_at
        ? new Date(tokenRow.expires_at as string)
        : null;
      const revokeResult = await revokeNaverToken(
        tokenRow.access_token,
        tokenRow.refresh_token,
        expiresAt,
      );
      if (!revokeResult.ok) {
        console.error(
          '[deleteAccount] naver revoke failed (best-effort):',
          revokeResult.reason,
        );
      }
    }
  } catch (e) {
    console.error('[deleteAccount] naver revoke exception:', e);
  }

  // 3) 쿠키 정리. admin.deleteUser 후에는 세션이 무효이므로 먼저 sign out.
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error('[deleteAccount] signOut error:', e);
  }

  // 4) auth.users 삭제. ON DELETE CASCADE 로 oauth_tokens 도 같이 삭제.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('[deleteAccount] admin.deleteUser error:', deleteError);
    return { ok: false, error: deleteError.message };
  }

  // 5) sb-* auth 쿠키 명시 cleanup — signOut 의 cookieStore mutation 이
  //    server-action 환경에서 best-effort 라 orphan 쿠키가 남을 수 있음.
  try {
    const cookieStore = await cookies();
    for (const c of cookieStore.getAll()) {
      if (c.name.startsWith('sb-')) cookieStore.delete(c.name);
    }
  } catch {
    // 무시 — redirect 직전.
  }

  redirect('/');
}

/**
 * 비밀번호 재설정 메일 발송 — server-side OAuth-only 가드.
 *
 * 이전 client-side `resetPasswordForEmail` 은 누구나 호출 가능 →
 * OAuth-only 사용자 (Naver/Google) 도 reset link 받아 비번 설정해 email
 * 인증 추가 가능 (OAuth-only → email+OAuth 전환). 본인은 본인 account
 * 만 영향이라 immediate exploit 위험 낮지만 defense-in-depth 측면 차단.
 *
 * **Email enumeration 방지**: 결과 (user 미존재 / OAuth-only / 발송 성공)
 * 무관 항상 `{ ok: true }` 반환. 실제 발송은 hasEmailIdentity 만.
 *
 * Wave 1 사후 codex P2 finding (PR #85 review 흐름) follow-up.
 */
export async function requestPasswordReset(
  email: string,
  captchaToken?: string,
): Promise<{ ok: true }> {
  const trimmed = email.trim();
  if (!trimmed) return { ok: true };

  // Rate limit by IP — silent reject (enumeration 방지)
  try {
    const h = await headers();
    const xff = h.get('x-forwarded-for');
    const ip = (xff ? xff.split(',')[0]?.trim() : null) ?? 'unknown';
    const { ok: rlOk } = await checkRateLimit(
      `pwd-reset:${ip}`,
      getOAuthStartRateLimit(),
    );
    if (!rlOk) return { ok: true };
  } catch (e) {
    console.error('[requestPasswordReset] rate limit error', e);
    // fail-open for rate limit infra error (otherwise prod down) — silent
  }

  // user 조회 — 결과 무관 silent
  const lookup = await findUserByEmail(trimmed);
  if (lookup.error || !lookup.user) {
    return { ok: true };
  }

  // OAuth-only 사용자 차단 — silent reject (enumeration 방지)
  if (!hasEmailIdentity(lookup.user)) {
    console.warn(
      '[requestPasswordReset] OAuth-only user blocked — userId=%s',
      lookup.user.id,
    );
    return { ok: true };
  }

  // email 인증 사용자만 실제 발송
  const h = await headers();
  const origin =
    h.get('origin') ?? `https://${h.get('host') ?? 'kontaxt.kr'}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${origin}/reset-password`,
    captchaToken,
  });
  if (error) {
    console.error('[requestPasswordReset] supabase error', error.message);
    // silent — enumeration 방지
  }
  return { ok: true };
}
