// OAuth provider 권한 revoke 헬퍼 — 회원탈퇴 시 외부 권한 해제 best-effort.
// [[project_naver_auto_relogin_followup]] layer 2 자동화.
//
// Naver delete API:
//   POST https://nid.naver.com/oauth2.0/token
//   params: grant_type=delete, client_id, client_secret, access_token
//
// access_token 만료 시 refresh_token 으로 재발급 후 재시도 (best-effort).

type RevokeResult = {
  ok: boolean;
  reason?: string;
};

/**
 * Naver access_token 으로 권한 해제 시도. access_token 만료면 refresh 후 재시도.
 * 모든 실패 (token 없음 / refresh 실패 / Naver API error) 에서 false 반환 + reason.
 * deleteAccount 흐름은 결과와 무관하게 진행 (best-effort).
 *
 * @param expiresAt - 보관된 access_token 의 만료 시각. 이미 만료됐으면 1차
 *   delete 호출 skip 하고 직접 refresh 분기로 (Naver API call 1회 절감).
 *   Wave 1 사후 codex NIT (PR #101 review) follow-up.
 */
export async function revokeNaverToken(
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null = null,
): Promise<RevokeResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false, reason: 'env_missing' };
  }

  const callDelete = async (token: string): Promise<RevokeResult> => {
    try {
      // 5s timeout — Naver API hang 시 회원탈퇴 lambda 가 60s 한계까지
      // 기다리면 사용자에게 "탈퇴 안 됨" 으로 보이는 UX 차단.
      // Wave 1 사후 routine codex+infra finding (PR #101 review).
      const res = await fetch('https://nid.naver.com/oauth2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'delete',
          client_id: clientId,
          client_secret: clientSecret,
          access_token: token,
          service_provider: 'NAVER',
        }).toString(),
        signal: AbortSignal.timeout(5000),
      });
      const data = (await res.json()) as { result?: string; error?: string };
      if (data.result === 'success') return { ok: true };
      return { ok: false, reason: data.error ?? 'naver_api_error' };
    } catch (e) {
      return {
        ok: false,
        reason: `fetch_exception: ${e instanceof Error ? e.message : 'unknown'}`,
      };
    }
  };

  // expires_at 만료 검사 — 이미 만료 확실하면 1차 delete 호출 skip
  // (Naver API call 1회 절감). 단 expiresAt 모름 (null) 이면 그냥 시도.
  const expired = expiresAt !== null && expiresAt.getTime() <= Date.now();

  let firstFailReason: string = expired ? 'token_expired' : 'naver_api_error';

  // 1차 — 보관된 access_token 으로 직접 호출 (만료 안 됐을 때만)
  if (!expired) {
    const first = await callDelete(accessToken);
    if (first.ok) return first;
    firstFailReason = first.reason ?? 'naver_api_error';
  }

  // 2차 — refresh_token 있으면 새 access_token 받고 재시도
  if (!refreshToken) return { ok: false, reason: firstFailReason };
  try {
    const refreshRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }).toString(),
      // 5s timeout (위 callDelete 와 동일 사유).
      signal: AbortSignal.timeout(5000),
    });
    const refreshData = (await refreshRes.json()) as {
      access_token?: string;
      error?: string;
    };
    if (!refreshData.access_token) {
      return { ok: false, reason: refreshData.error ?? 'refresh_failed' };
    }
    return callDelete(refreshData.access_token);
  } catch (e) {
    return {
      ok: false,
      reason: `refresh_exception: ${e instanceof Error ? e.message : 'unknown'}`,
    };
  }
}
