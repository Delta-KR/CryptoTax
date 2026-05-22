// GoTrue admin REST 헬퍼 — `auth-js@2.105.4`의 `listUsers`가 email filter를 미지원하므로
// 직접 `/auth/v1/admin/users?filter=<email>`을 호출. GoTrue 서버는 filter를 email substring 매칭으로 처리하는데,
// 우리는 정확 매칭(exact match)만 필요하므로 결과를 다시 email === query로 한 번 더 거른다.
//
// 사용 목적: OAuth callback에서 generateLink 호출 전에 "이 email로 다른 provider 가입된 계정이 있는지" 검증.
// 다른 provider로 가입된 계정에 magic link로 강제 로그인 → account takeover 방지 (C2).

import type { User } from '@supabase/supabase-js';

interface AdminUsersListResponse {
  users: User[];
}

export interface UserLookupResult {
  user: User | null;
  /** REST 호출 실패 시 true — 호출자는 fail-closed (가입 시도 차단) 결정 가능. */
  error: boolean;
}

/**
 * 주어진 email로 등록된 Supabase Auth 사용자를 찾는다.
 *
 * GoTrue `GET /admin/users?filter=<email>`은 email substring 매칭을 하므로,
 * `foo@example.com` 검색 시 `foobar@example.com`도 함께 반환될 수 있다.
 * 따라서 결과 중 email이 정확히 일치하는 row만 추려서 반환.
 */
export async function findUserByEmail(
  email: string,
): Promise<UserLookupResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[findUserByEmail] missing supabase env');
    return { user: null, error: true };
  }
  // email-only 입력. 외부 입력이므로 encode 후 query에 사용.
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { user: null, error: false };

  try {
    const url = new URL('/auth/v1/admin/users', supabaseUrl);
    url.searchParams.set('filter', normalized);
    url.searchParams.set('per_page', '50');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      // Next.js fetch cache 방지 — Auth 상태는 항상 최신이어야 함.
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(
        '[findUserByEmail] admin/users HTTP error',
        res.status,
        await res.text().catch(() => ''),
      );
      return { user: null, error: true };
    }
    const data = (await res.json()) as AdminUsersListResponse;
    const match = (data.users ?? []).find(
      (u) => u.email?.trim().toLowerCase() === normalized,
    );
    return { user: match ?? null, error: false };
  } catch (e) {
    console.error('[findUserByEmail] unexpected error', e);
    return { user: null, error: true };
  }
}
