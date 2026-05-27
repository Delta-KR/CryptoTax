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
 */
export async function revokeNaverToken(
  accessToken: string,
  refreshToken: string | null,
): Promise<RevokeResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false, reason: 'env_missing' };
  }

  const callDelete = async (token: string): Promise<RevokeResult> => {
    try {
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

  // 1차 — 보관된 access_token 으로 직접 호출
  const first = await callDelete(accessToken);
  if (first.ok) return first;

  // 2차 — refresh_token 있으면 새 access_token 받고 재시도
  if (!refreshToken) return first;
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
