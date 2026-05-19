import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase 클라이언트 모킹 — 단위 테스트는 DB query 없이 fallback/cache 로직만 검증.
// 실제 DB 통합 검증은 E2E 흐름 (`app/actions/calculate.ts`)에서 담당.
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    from: () => ({
      select: () => ({
        in: () => ({
          in: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

import { DBExchangeRateProvider } from '../rate-provider';

describe('DBExchangeRateProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('정적 fallback 경로: DB 미스 → 분기별 USDT 환율 사용', async () => {
    const provider = new DBExchangeRateProvider(7);
    // 정적 fallback에 등록된 날짜
    const rate = await provider.getRate(
      new Date('2027-01-01T00:00:00+09:00'),
      'USDT',
      'KRW',
    );
    expect(rate).toBe(1480);
    expect(provider.getSourceInfo().fallbackUsed).toBe(true);
  });

  it('정적 fallback 경로: BTC/KRW도 동작', async () => {
    const provider = new DBExchangeRateProvider(7);
    const rate = await provider.getRate(
      new Date('2027-01-01T00:00:00+09:00'),
      'BTC',
      'KRW',
    );
    expect(rate).toBe(150_000_000);
  });

  it('동일 통화: from === to → 1 (DB·fallback 우회)', async () => {
    const provider = new DBExchangeRateProvider(7);
    const rate = await provider.getRate(new Date(), 'KRW', 'KRW');
    expect(rate).toBe(1);
    // 우회 경로라 fallback flag 변경 없음
    expect(provider.getSourceInfo().fallbackUsed).toBe(false);
  });

  it('알 수 없는 통화: DB·fallback 모두 미스 → throw', async () => {
    const provider = new DBExchangeRateProvider(7);
    await expect(
      provider.getRate(
        new Date('2027-01-01T00:00:00+09:00'),
        'UNKNOWNCOIN',
        'KRW',
      ),
    ).rejects.toThrow(/환율 데이터 누락/);
  });

  it('getSourceInfo: 초기엔 fallback 사용 안 함, 미스 발생 후 true로 전환', async () => {
    const provider = new DBExchangeRateProvider(7);
    expect(provider.getSourceInfo().fallbackUsed).toBe(false);

    // fallback 사용 트리거
    await provider.getRate(
      new Date('2027-01-01T00:00:00+09:00'),
      'USDT',
      'KRW',
    );
    expect(provider.getSourceInfo().fallbackUsed).toBe(true);
    expect(provider.getSourceInfo().primary).toBe('(DB 미적재)'); // DB 모킹이 빈 결과 반환
  });
});
