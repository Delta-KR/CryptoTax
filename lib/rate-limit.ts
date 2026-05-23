// Upstash Redis 기반 슬라이딩 윈도우 rate limit. Vercel + Edge 안정.
//
// 환경변수: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Redis.fromEnv).
// 미설정 시 fail-closed (open 아닌 close) — 환경 오류는 prod 에서 발생하면 안 됨.
//
// Limit 설계:
//   report (PDF) — IP+user 1m/10. 무거운 작업, DoS 차단.
//   calculate — user 1m/20. 자주 호출, 회사 NAT 영향 없게 user 기반.
//   auth-reauth — user 15m/5. changePassword brute-force 차단.
//   oauth-start — IP 1m/10. generateLink 쿼터·magic link 비용 보호.

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (_redis) return _redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 환경변수가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.',
    );
  }
  _redis = Redis.fromEnv();
  return _redis;
}

// Lazy singleton 캐시 — 각 limiter 는 1회만 생성. prefix 가 key.
const _limiterCache = new Map<string, Ratelimit>();

function makeLimit(prefix: string, count: number, window: '1 m' | '15 m'): Ratelimit {
  const cached = _limiterCache.get(prefix);
  if (cached) return cached;
  const limit = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(count, window),
    analytics: true,
    prefix,
  });
  _limiterCache.set(prefix, limit);
  return limit;
}

export const getReportRateLimit = () => makeLimit('kontaxt-report', 10, '1 m');
export const getCalculateRateLimit = () => makeLimit('kontaxt-calculate', 20, '1 m');
export const getAuthReauthRateLimit = () => makeLimit('kontaxt-auth-reauth', 5, '15 m');
export const getOAuthStartRateLimit = () => makeLimit('kontaxt-oauth-start', 10, '1 m');

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * 슬라이딩 윈도우 rate limit 체크. Redis 오류 / 환경변수 누락 시 fail-closed.
 *
 * @param identifier IP, user.id 등 식별자
 * @param rateLimit `getReportRateLimit()` 등의 factory 결과
 */
export async function checkRateLimit(
  identifier: string,
  rateLimit: Ratelimit,
): Promise<RateLimitResult> {
  try {
    const { success, limit, remaining, reset } = await rateLimit.limit(identifier);
    return { ok: success, limit, remaining, reset };
  } catch (e) {
    console.error('[checkRateLimit] error — fail-closed:', e);
    return { ok: false, limit: 0, remaining: 0, reset: Date.now() + 60_000 };
  }
}

/**
 * 429 응답 빌더 — 표준 X-RateLimit-* + Retry-After 헤더 일괄 부착.
 * /api/* 라우트에서 동일 패턴이 여러 곳에 반복되던 boilerplate 제거.
 */
export function rateLimitResponse(
  result: RateLimitResult,
  message: string,
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
        'Retry-After': String(
          Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        ),
      },
    },
  );
}
