import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Redis } from '@upstash/redis';

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
// stale window: payload 에 timestamp 를 묶어 5분 내 발급분만 통과시킨다. access_token
// 자체와의 binding 은 callback 이 Supabase verify 이전 단계라 token 을 아직 모르므로
// 구조상 불가능.
//
// single-use (relay/replay 차단 — CSO 감사 2026-05-29): 유효한 fn 은 위조는 못 하지만
// 그대로 캡처해 victim 에게 5분 내 relay 할 수 있다 (공격자 본인 로그인 URL 의 fragment
// 토큰 + 유효 fn). victim 이 열면 FinishClient 가 attacker 세션을 설치 → login-CSRF /
// session fixation. 따라서 fn 은 1회용으로 강제한다 — /auth/finish 가 consumeFinishNonce
// 로 SET NX 첫 사용만 통과시키고 재사용은 거부. 공격자 본인 브라우저가 정상 로그인 시
// nonce 를 먼저 소비하므로 relay 된 URL 은 거부된다.
// 잔여 위협: 공격자가 victim 마다 headless 로 fresh 로그인을 자동화하면 fresh nonce 라
// single-use 로는 못 막는다 — 완전 차단은 /start 발급 browser-binding cookie 가 필요
// (same-site kontaxt.kr→kontaxt.kr 라 PR #72 cross-site 유실 없음. preview 검증 후 별도 PR).

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

// ──────────── single-use nonce store (relay/replay 차단) ────────────
// Upstash Redis 기반. 미설정/오류 시 fail-open (sig+ts 검증으로 degrade) — login
// 가용성 우선. Redis 는 이미 oauth-start rate limit 으로 Naver 로그인 경로에 있으므로
// 신규 의존성이 아니다.

const NONCE_STORE_TTL_S = 6 * 60; // fn 만료(5분)보다 길게 — 만료된 fn 은 어차피 verify 에서 reject.
const NONCE_KEY_PREFIX = 'kontaxt-finish-nonce:';

let _nonceRedis: Redis | null = null;
function getNonceRedis(): Redis | null {
  if (_nonceRedis) return _nonceRedis;
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  _nonceRedis = Redis.fromEnv();
  return _nonceRedis;
}

// 토큰 payload 에서 nonce(n) 추출. verifyFinishToken 통과 후에만 호출 (서명 미검증).
export function extractNonce(token: string | null | undefined): string | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(token.slice(0, dot), 'base64url').toString('utf8'),
    );
    return typeof payload?.n === 'string' ? payload.n : null;
  } catch {
    return null;
  }
}

export type NonceConsumeResult = 'ok' | 'replayed' | 'store_unavailable';

// fn 1회용 소비. SET NX 로 첫 사용이면 'ok', 이미 쓰인 nonce(relay/replay)면 'replayed',
// Redis 미설정·오류면 'store_unavailable'(fail-open). page.tsx 가 'replayed' 면 거부한다.
export async function consumeFinishNonce(
  nonce: string,
): Promise<NonceConsumeResult> {
  const redis = getNonceRedis();
  if (!redis) return 'store_unavailable';
  try {
    const res = await redis.set(`${NONCE_KEY_PREFIX}${nonce}`, 1, {
      nx: true,
      ex: NONCE_STORE_TTL_S,
    });
    return res === 'OK' ? 'ok' : 'replayed';
  } catch (e) {
    console.warn(
      '[finish-nonce] single-use store 오류 — fail-open (sig+ts 검증 유지):',
      e,
    );
    return 'store_unavailable';
  }
}
