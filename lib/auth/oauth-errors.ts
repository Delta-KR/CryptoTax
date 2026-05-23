// OAuth callback에서 받은 error를 그대로 echo하면 phishing 메시지 주입에 악용 가능 (`?error=계좌 잠김. 010-xxxx로 연락`).
// 사용자 표시는 화이트리스트 코드로만 매핑하고, 원본 메시지는 console.error로만 기록.

export type OAuthErrorCode =
  | 'cancelled'
  | 'access_denied'
  | 'invalid_request'
  | 'server_error'
  | 'session_expired'
  | 'otp_expired'
  | 'already_registered_other_provider'
  | 'rate_limited'
  | 'unknown';

// otp_expired는 메일 링크(비번 재설정·가입 인증·매직 링크)가 만료되거나 이미 사용된 케이스.
// access_denied보다 먼저 매칭해야 함 — Supabase가 둘 다 박아 보내므로.
// already_registered_other_provider는 OAuth 콜백에서 우리가 직접 박는 코드 — Supabase가 보내는 게 아니라
// 다른 provider로 가입된 email 차단 시 발급 (C2 takeover 방지).
const RAW_TO_CODE: Array<[RegExp, OAuthErrorCode]> = [
  [/already[ _]registered[ _]other[ _]provider/i, 'already_registered_other_provider'],
  [/rate[ _]limited|too[ _]many[ _]requests/i, 'rate_limited'],
  [/otp_expired|email[ _]link[ _]is[ _]invalid|email[ _]link[ _]has[ _]expired/i, 'otp_expired'],
  [/cancel|user.?denied/i, 'cancelled'],
  [/access[ _]denied/i, 'access_denied'],
  [/invalid[ _]request/i, 'invalid_request'],
  [/server[ _]error|internal/i, 'server_error'],
  [/expired|invalid[ _]grant|state/i, 'session_expired'],
];

export function classifyOAuthError(raw: string | null | undefined): OAuthErrorCode {
  if (!raw) return 'unknown';
  for (const [re, code] of RAW_TO_CODE) {
    if (re.test(raw)) return code;
  }
  return 'unknown';
}

const MESSAGES: Record<OAuthErrorCode, string> = {
  cancelled: '소셜 로그인이 취소되었습니다.',
  access_denied: '소셜 로그인 권한 요청이 거부되었습니다.',
  invalid_request: '소셜 로그인 요청이 올바르지 않습니다. 다시 시도해주세요.',
  server_error: '소셜 로그인 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.',
  session_expired: '로그인 세션이 만료되었습니다. 다시 시도해주세요.',
  otp_expired: '메일 링크가 만료됐거나 이미 사용됐어요. 비밀번호 찾기를 다시 요청해주세요.',
  already_registered_other_provider:
    '이미 다른 방식(이메일/Google/Kakao 등)으로 가입된 이메일입니다. 원래 가입한 방식으로 로그인해주세요.',
  rate_limited: '잠시 후 다시 시도해주세요.',
  unknown: '소셜 로그인 중 오류가 발생했습니다.',
};

export function oauthErrorMessage(code: OAuthErrorCode | string | null | undefined): string {
  if (!code) return MESSAGES.unknown;
  if (code in MESSAGES) return MESSAGES[code as OAuthErrorCode];
  return MESSAGES.unknown;
}
