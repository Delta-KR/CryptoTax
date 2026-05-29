import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// /auth/finish phishing 방어 (audit security P1-6).
//
// 문제: /auth/finish 는 URL fragment 의 access_token 만으로 setSession 한다.
// 공격자가 victim 한테 kontaxt.kr/auth/finish#access_token=ATTACKER_TOKEN 직격
// 링크를 보내면 victim 이 attacker 계정으로 로그인 → victim 입력이 attacker
// 계정에 적재되는 session fixation 가능.
//
// 방어: legitimate flow (Naver callback) 만 발급할 수 있는 HMAC 서명 nonce 를
// generateLink 의 redirectTo query (`?fn=...`) 에 실어 보내고, /auth/finish 가
// 서버에서 서명을 검증한다. 공격자는 AUTH_FINISH_NONCE_SECRET 을 모르므로 유효한
// fn 을 위조할 수 없다.
//
// 왜 cookie 가 아니라 HMAC query 인가:
// PR #72 는 httpOnly nonce cookie 를 발급했지만 Naver → supabase.co → kontaxt.kr
// cross-site redirect chain 에서 cookie 가 /auth/finish 도착 시 유실돼 모든 Naver
// 로그인이 깨졌다 (PR #79 revert). HMAC 서명 query 는 cookie 가 없어 cross-site
// 유실 자체가 없고, stateless 라 서버 상태도 불필요하다.
//
// stale window: payload 에 timestamp 를 묶어 5분 내 발급분만 통과시킨다 (nonce ↔
// token HMAC binding 항목의 실질). access_token 자체와의 binding 은 callback 이
// Supabase verify 이전 단계라 token 을 아직 모르므로 구조상 불가능.
//
// replay (5분 내 같은 fn 재사용) 는 정당 사용자의 정상 재시도라 위협이 아니다 —
// nonce 의 목적은 외부 phishing fragment 차단이지 1회용 강제가 아니다.

const MAX_AGE_MS = 5 * 60 * 1000; // 5분
const CLOCK_SKEW_MS = 60 * 1000; // 1분 (서버 간 시계 오차 허용)

function getSecret(): string {
  return process.env.AUTH_FINISH_NONCE_SECRET ?? '';
}

function sign(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

// `<base64url(payload)>.<base64url(hmac)>` 형태 토큰 발급.
// SECRET 미설정 시 throw — callback 이 silent 로 nonce 없이 진행하면 보안 무의미.
export function generateFinishToken(now: number = Date.now()): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error('AUTH_FINISH_NONCE_SECRET is not configured');
  }
  const payload = JSON.stringify({ n: randomBytes(16).toString('hex'), ts: now });
  const b64 = Buffer.from(payload, 'utf8').toString('base64url');
  return `${b64}.${sign(b64, secret)}`;
}

// 서명 + 만료 검증. SECRET 미설정·토큰 부재·서명 불일치·만료·미래 timestamp 는 모두
// false (fail-closed). throw 하지 않는다 — 호출부(page.tsx)가 redirect 로 처리.
export function verifyFinishToken(
  token: string | null | undefined,
  now: number = Date.now(),
): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;

  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return false;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(b64, secret);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  // 길이 다르면 timingSafeEqual 이 throw → 먼저 차단.
  if (sigBuf.length !== expBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expBuf)) return false;

  let ts: unknown;
  try {
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    ts = parsed?.ts;
  } catch {
    return false;
  }
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return false;
  if (now - ts > MAX_AGE_MS) return false; // 만료
  if (ts - now > CLOCK_SKEW_MS) return false; // 미래 (위조 의심)
  return true;
}
