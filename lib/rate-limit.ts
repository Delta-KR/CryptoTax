// P4-R1 — Upstash Redis 기반 IP/user 슬라이딩 윈도우 rate limit.
// 무료 cold-start 빠르고, Vercel + Edge에서 안정적으로 동작.
//
// 환경변수 (Vercel + 로컬):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//
// Redis.fromEnv()가 둘 다 읽음. 미설정 시 throw — 보수적으로 차단(open이 아니라 close)되도록
// checkRateLimit에서 명시적으로 핸들링. 다만 환경변수 누락은 환경 설정 오류이므로 prod에서는
// 절대 발생하면 안 됨.
//
// Limit 설정 근거:
//   /api/report (PDF 생성)는 무거운 작업 — 분당 10회면 사용자 1명이 합리적으로 신고용 PDF를
//   여러 번 받기에는 충분하고, 봇/DoS는 빠르게 차단됨.
//   calculate (server action)은 자주 호출 가능 (파일 추가 업로드, 다른 method 시도 등) →
//   분당 20회로 살짝 여유. user.id 기반이라 IP 공유 환경(회사 NAT)도 영향 없음.
//
// 향후 운영:
//   Upstash 콘솔 analytics 활성화 시 키별 사용량 + 차단율 트래킹 가능 (analytics: true).
//   요금제 free tier 10K commands/day까지 무료.
//
// Test 환경:
//   Vitest에서는 환경변수 미설정 → fromEnv() throw. 단위 테스트에서는 이 모듈 직접 import하지
//   않거나 mocking 필요. 통합 테스트는 prod env로만.
//   현재 단위 테스트에서는 calculate.ts를 mock 없이 import하지 않음 (lib/engine 직접 테스트).

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy singleton — module load 시점에는 throw하지 않도록 함수로 감싸 첫 호출 시점에만 초기화.
// 환경변수 누락 시 명확한 에러 메시지로 fail-closed.

let _redis: Redis | null = null;
let _reportLimit: Ratelimit | null = null;
let _calculateLimit: Ratelimit | null = null;

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

export function getReportRateLimit(): Ratelimit {
  if (_reportLimit) return _reportLimit;
  _reportLimit = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 분당 10회 IP
    analytics: true,
    prefix: 'kontaxt-report',
  });
  return _reportLimit;
}

export function getCalculateRateLimit(): Ratelimit {
  if (_calculateLimit) return _calculateLimit;
  _calculateLimit = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 분당 20회 user
    analytics: true,
    prefix: 'kontaxt-calculate',
  });
  return _calculateLimit;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * 슬라이딩 윈도우 rate limit 체크. 환경변수 미설정 시 fail-closed (요청 차단).
 *
 * @param identifier IP, user.id 등 식별자
 * @param rateLimit `getReportRateLimit()` 또는 `getCalculateRateLimit()`
 */
export async function checkRateLimit(
  identifier: string,
  rateLimit: Ratelimit,
): Promise<RateLimitResult> {
  try {
    const { success, limit, remaining, reset } = await rateLimit.limit(identifier);
    return { ok: success, limit, remaining, reset };
  } catch (e) {
    // Redis 통신 오류 또는 환경변수 누락. prod에서는 환경 설정 오류 외에는 발생하지 않아야 함.
    // fail-closed로 보수적 차단 (DoS 방어 우선). 다만 로그로 감지 가능하게.
    console.error('[checkRateLimit] error — fail-closed:', e);
    return { ok: false, limit: 0, remaining: 0, reset: Date.now() + 60_000 };
  }
}
