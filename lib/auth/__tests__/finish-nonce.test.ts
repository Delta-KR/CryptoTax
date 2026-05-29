import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generateFinishToken, verifyFinishToken } from '@/lib/auth/finish-nonce';

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
const MAX_OVER = 5 * 60_000 + 1_000; // 5분 + 1초 (만료 경계 초과)
let prevSecret: string | undefined;

beforeAll(() => {
  prevSecret = process.env.AUTH_FINISH_NONCE_SECRET;
  process.env.AUTH_FINISH_NONCE_SECRET = SECRET;
});

afterAll(() => {
  if (prevSecret === undefined) delete process.env.AUTH_FINISH_NONCE_SECRET;
  else process.env.AUTH_FINISH_NONCE_SECRET = prevSecret;
});

describe('generateFinishToken / verifyFinishToken — round trip', () => {
  it('방금 발급한 토큰은 통과한다', () => {
    const now = 1_800_000_000_000;
    const token = generateFinishToken(now);
    expect(verifyFinishToken(token, now)).toBe(true);
  });

  it('발급할 때마다 nonce 가 달라 토큰이 매번 다르다', () => {
    expect(generateFinishToken()).not.toBe(generateFinishToken());
  });

  it('5분 직전(4분59초)은 아직 통과', () => {
    const now = 1_800_000_000_000;
    const token = generateFinishToken(now);
    expect(verifyFinishToken(token, now + 4 * 60_000 + 59_000)).toBe(true);
  });
});

describe('verifyFinishToken — reject 케이스', () => {
  const now = 1_800_000_000_000;

  it('null / undefined / 빈 문자열 → false', () => {
    expect(verifyFinishToken(null)).toBe(false);
    expect(verifyFinishToken(undefined)).toBe(false);
    expect(verifyFinishToken('')).toBe(false);
  });

  it('점(.) 없는 토큰 → false', () => {
    expect(verifyFinishToken('garbagewithoutdot', now)).toBe(false);
  });

  it('점으로 시작/끝나는 토큰 → false', () => {
    expect(verifyFinishToken('.sig', now)).toBe(false);
    expect(verifyFinishToken('payload.', now)).toBe(false);
  });

  it('서명이 틀리면 → false (위조 차단)', () => {
    const token = generateFinishToken(now);
    const [b64] = token.split('.');
    expect(verifyFinishToken(`${b64}.deadbeefdeadbeef`, now)).toBe(false);
  });

  it('payload 변조(서명은 그대로) → false', () => {
    const token = generateFinishToken(now);
    const sig = token.split('.')[1];
    const forged = Buffer.from(JSON.stringify({ n: 'x', ts: now })).toString('base64url');
    expect(verifyFinishToken(`${forged}.${sig}`, now)).toBe(false);
  });

  it('5분 초과 만료 → false', () => {
    const token = generateFinishToken(now);
    expect(verifyFinishToken(token, now + MAX_OVER)).toBe(false);
  });

  it('미래 timestamp (clock skew 초과) → false', () => {
    const future = now + 10 * 60_000;
    const token = generateFinishToken(future);
    expect(verifyFinishToken(token, now)).toBe(false);
  });

  it('SECRET 미설정이면 → false (fail-closed)', () => {
    const token = generateFinishToken(now);
    delete process.env.AUTH_FINISH_NONCE_SECRET;
    expect(verifyFinishToken(token, now)).toBe(false);
    process.env.AUTH_FINISH_NONCE_SECRET = SECRET;
  });
});

describe('generateFinishToken — SECRET 미설정 시 throw', () => {
  it('SECRET 없으면 발급 자체를 throw (silent skip 방지)', () => {
    const saved = process.env.AUTH_FINISH_NONCE_SECRET;
    delete process.env.AUTH_FINISH_NONCE_SECRET;
    expect(() => generateFinishToken()).toThrow(/AUTH_FINISH_NONCE_SECRET/);
    process.env.AUTH_FINISH_NONCE_SECRET = saved;
  });
});
