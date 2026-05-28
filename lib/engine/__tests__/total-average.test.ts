import { describe, expect, it } from 'vitest';
import { calculateTax } from '../tax-calculator';
import type { UnifiedTransaction } from '../types';

function tx(overrides: Partial<UnifiedTransaction>): UnifiedTransaction {
  return {
    id: 'tx-' + Math.random().toString(36).slice(2),
    date: new Date('2027-06-01T00:00:00+09:00'),
    type: 'BUY',
    coin: 'BTC',
    amount: 1,
    pricePerUnitKRW: 50_000_000,
    totalKRW: 50_000_000,
    feeKRW: 0,
    exchange: 'Upbit',
    originalCurrency: 'KRW',
    ...overrides,
  };
}

describe('TotalAverageEngine (시행령 §88① · §92②4호)', () => {
  describe('과세기간 전체 평균단가 산출', () => {
    it('여러 매수 → 단일 매도: 평균단가 = 총취득가 / 총수량', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-01-15T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 0.5,
            totalKRW: 40_000_000,
          }),
          tx({
            type: 'BUY',
            date: new Date('2027-03-15T00:00:00+09:00'),
            pricePerUnitKRW: 100_000_000,
            amount: 0.5,
            totalKRW: 50_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-06-01T00:00:00+09:00'),
            pricePerUnitKRW: 120_000_000,
            amount: 0.5,
            totalKRW: 60_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
      });
      // 평균단가 = 90,000,000원/BTC
      // 매도 0.5 → 취득가 = 0.5 × 90,000,000 = 45,000,000
      // 손익 = 60,000,000 - 45,000,000 = 15,000,000
      expect(result.realizedGains).toHaveLength(1);
      expect(result.realizedGains[0].costBasisKRW).toBe(45_000_000);
      expect(result.realizedGains[0].pnlKRW).toBe(15_000_000);
    });

    it('FIFO와 결과가 다름 — 같은 거래에서 lot별 매칭이 아닌 평균단가 적용', () => {
      const transactions = [
        tx({
          type: 'BUY',
          date: new Date('2027-01-15T00:00:00+09:00'),
          pricePerUnitKRW: 80_000_000,
          amount: 0.5,
          totalKRW: 40_000_000,
        }),
        tx({
          type: 'BUY',
          date: new Date('2027-03-15T00:00:00+09:00'),
          pricePerUnitKRW: 100_000_000,
          amount: 0.5,
          totalKRW: 50_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 120_000_000,
          amount: 0.7,
          totalKRW: 84_000_000,
        }),
      ];
      const ta = calculateTax({ transactions, year: 2027, method: 'totalAverage' });
      const fifo = calculateTax({ transactions, year: 2027, method: 'fifo' });
      // TA: 평균 90M, 매도 0.7 → 취득가 63M, 손익 21M
      // FIFO: 0.5 × 80M + 0.2 × 100M = 60M, 손익 24M
      expect(ta.realizedGains[0].costBasisKRW).toBe(63_000_000);
      expect(fifo.realizedGains[0].costBasisKRW).toBe(60_000_000);
      expect(ta.realizedGains[0].pnlKRW).not.toBe(fifo.realizedGains[0].pnlKRW);
    });
  });

  describe('연 단위 carry-over (다년치 처리)', () => {
    it('2027 연말 잔량이 2028 기초 보유로 이월', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 50_000_000,
            amount: 1,
            totalKRW: 50_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-09-01T00:00:00+09:00'),
            pricePerUnitKRW: 60_000_000,
            amount: 0.4,
            totalKRW: 24_000_000,
          }),
          // 2028 매수 추가
          tx({
            type: 'BUY',
            date: new Date('2028-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 0.4,
            totalKRW: 32_000_000,
          }),
          // 2028 매도
          tx({
            type: 'SELL',
            date: new Date('2028-09-01T00:00:00+09:00'),
            pricePerUnitKRW: 100_000_000,
            amount: 0.5,
            totalKRW: 50_000_000,
          }),
        ],
        year: 2028,
        method: 'totalAverage',
      });
      // 2027 처리: 매수 1 @ 50M, 매도 0.4 @ 60M
      //   2027 평균 = 50M
      //   2027 매도 손익 = 0.4 × (60M − 50M) = 4M (but year=2028 검사라 realizedGains 미포함)
      //   2027 연말 잔량: 0.6, 가액 = 0.6 × 50M = 30M
      // 2028 처리:
      //   기초 보유: 0.6 @ 평균 50M = 30M
      //   매수: 0.4 @ 80M = 32M
      //   2028 평균 = (30M + 32M) / 1.0 = 62M
      //   매도 0.5 → 취득가 31M, 손익 = 50M − 31M = 19M
      expect(result.realizedGains).toHaveLength(1);
      expect(result.realizedGains[0].costBasisKRW).toBe(31_000_000);
      expect(result.realizedGains[0].pnlKRW).toBe(19_000_000);
    });
  });

  describe('의제취득가액 결합 (시행 전 보유 → 시행 후 매도)', () => {
    it('Max(실매수, 시가) 적용 후 2027 평균 산출', () => {
      const result = calculateTax({
        transactions: [
          // 2026 매수 (시행 전): 실 매수가 40M, 의제 시가 70M → 의제 적용 (70M)
          tx({
            type: 'BUY',
            date: new Date('2026-08-01T00:00:00+09:00'),
            pricePerUnitKRW: 40_000_000,
            amount: 1,
            totalKRW: 40_000_000,
          }),
          // 2027 매수: 실 매수가 80M
          tx({
            type: 'BUY',
            date: new Date('2027-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 1,
            totalKRW: 80_000_000,
          }),
          // 2027 매도
          tx({
            type: 'SELL',
            date: new Date('2027-06-01T00:00:00+09:00'),
            pricePerUnitKRW: 100_000_000,
            amount: 1,
            totalKRW: 100_000_000,
          }),
        ],
        year: 2027,
        deemedCostPrices: new Map([['BTC', 70_000_000]]),
        method: 'totalAverage',
      });
      // 시행 전: 의제 가액 70M × 1 = 70M (carry)
      // 2027 평균 = (70M + 80M) / 2 = 75M
      // 매도 1 → 취득가 75M, 손익 = 100M − 75M = 25M
      expect(result.realizedGains[0].costBasisKRW).toBe(75_000_000);
      expect(result.realizedGains[0].pnlKRW).toBe(25_000_000);
    });

    it('실 매수가가 의제 시가보다 큰 경우: 실 매수가 사용 (Max)', () => {
      const result = calculateTax({
        transactions: [
          // 2026 매수: 실 매수가 90M, 의제 시가 70M → 실 매수가 적용
          tx({
            type: 'BUY',
            date: new Date('2026-08-01T00:00:00+09:00'),
            pricePerUnitKRW: 90_000_000,
            amount: 1,
            totalKRW: 90_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-06-01T00:00:00+09:00'),
            pricePerUnitKRW: 100_000_000,
            amount: 1,
            totalKRW: 100_000_000,
          }),
        ],
        year: 2027,
        deemedCostPrices: new Map([['BTC', 70_000_000]]),
        method: 'totalAverage',
      });
      // carry: 90M × 1 (의제 미적용)
      // 2027 평균 = 90M
      // 매도 손익 = 100M − 90M = 10M
      expect(result.realizedGains[0].costBasisKRW).toBe(90_000_000);
      expect(result.realizedGains[0].pnlKRW).toBe(10_000_000);
    });
  });

  describe('거주자별 통합 (시행령 §88①)', () => {
    it('여러 거래소 매수·매도가 코인 단위로 통합 평균', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            exchange: 'Upbit',
            date: new Date('2027-01-15T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 0.5,
            totalKRW: 40_000_000,
          }),
          tx({
            type: 'BUY',
            exchange: 'Binance',
            date: new Date('2027-02-15T00:00:00+09:00'),
            pricePerUnitKRW: 100_000_000,
            amount: 0.5,
            totalKRW: 50_000_000,
          }),
          tx({
            type: 'SELL',
            exchange: 'Bithumb',
            date: new Date('2027-06-01T00:00:00+09:00'),
            pricePerUnitKRW: 120_000_000,
            amount: 0.7,
            totalKRW: 84_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
      });
      // 거래소 통합 평균 = (40M + 50M) / 1 = 90M
      // 매도 0.7 (Bithumb) → 취득가 = 0.7 × 90M = 63M
      // 손익 = 84M − 63M = 21M
      // 거래소 cross 매칭이 법정 요구사항 (§88① "거주자별로")
      expect(result.realizedGains[0].costBasisKRW).toBe(63_000_000);
      expect(result.realizedGains[0].pnlKRW).toBe(21_000_000);
    });
  });

  describe('orphan 매도 (보유량 초과)', () => {
    it('매도량이 보유량 초과 시 손익 0 + warning 누적', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-01-15T00:00:00+09:00'),
            pricePerUnitKRW: 50_000_000,
            amount: 0.1,
            totalKRW: 5_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-06-01T00:00:00+09:00'),
            pricePerUnitKRW: 60_000_000,
            amount: 1, // 보유량 0.1 초과
            totalKRW: 60_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
      });
      // 보유량(0.1) < 매도량(1) → orphan 처리, costBasis = sellTotal (손익 0)
      expect(result.realizedGains).toHaveLength(1);
      expect(result.realizedGains[0].costBasisKRW).toBe(60_000_000);
      expect(result.realizedGains[0].pnlKRW).toBe(0);
      expect(result.warnings.some((w) => w.includes('보유량을 초과'))).toBe(true);
    });
  });

  describe('연 매도 없음 (잔량만)', () => {
    it('해당 연도 매도 없으면 realizedGains 빈 배열, holdingsAfter는 잔량', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 50_000_000,
            amount: 1,
            totalKRW: 50_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
      });
      expect(result.realizedGains).toHaveLength(0);
      expect(result.taxAmountKRW).toBe(0);
      expect(result.holdingsAfter.BTC).toBeDefined();
      expect(result.holdingsAfter.BTC[0].amount).toBe(1);
      expect(result.holdingsAfter.BTC[0].pricePerUnitKRW).toBe(50_000_000);
    });
  });

  describe('세액 계산', () => {
    it('손익 통산 + 250만원 공제 + 소득세 20% + 지방세 2%', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-01-15T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 1,
            totalKRW: 80_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-06-01T00:00:00+09:00'),
            pricePerUnitKRW: 90_000_000,
            amount: 1,
            totalKRW: 90_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
      });
      // 손익 10M, 공제 2.5M, 과세표준 7.5M
      // 소득세 7.5M × 0.20 = 1,500,000
      // 지방세 7.5M × 0.02 = 150,000
      expect(result.netPnLKRW).toBe(10_000_000);
      expect(result.taxableIncomeKRW).toBe(7_500_000);
      expect(result.incomeTaxKRW).toBe(1_500_000);
      expect(result.localTaxKRW).toBe(150_000);
      expect(result.taxAmountKRW).toBe(1_650_000);
    });

    it('순손실 시 세액 0', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-01-15T00:00:00+09:00'),
            pricePerUnitKRW: 90_000_000,
            amount: 1,
            totalKRW: 90_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-06-01T00:00:00+09:00'),
            pricePerUnitKRW: 70_000_000,
            amount: 1,
            totalKRW: 70_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
      });
      expect(result.netPnLKRW).toBe(-20_000_000);
      expect(result.taxableIncomeKRW).toBe(0);
      expect(result.taxAmountKRW).toBe(0);
    });
  });

  describe('과세기간 분리 (year filter)', () => {
    it('input.year의 매도만 realizedGains에 포함', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 50_000_000,
            amount: 2,
            totalKRW: 100_000_000,
          }),
          // 2027 매도
          tx({
            type: 'SELL',
            date: new Date('2027-09-01T00:00:00+09:00'),
            pricePerUnitKRW: 60_000_000,
            amount: 1,
            totalKRW: 60_000_000,
          }),
          // 2028 매도 — input.year=2027이라 제외
          tx({
            type: 'SELL',
            date: new Date('2028-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 1,
            totalKRW: 80_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
      });
      // 2027만: 1 매도. 평균 50M, 취득가 50M, 손익 10M
      expect(result.realizedGains).toHaveLength(1);
      expect(result.realizedGains[0].pnlKRW).toBe(10_000_000);
    });
  });
});

// =============================================================================
// Phase B — 엔진 robust 검증 (2026-05-28)
//
// docs/tax-law-compliance.md v1.0 검증 후 엔진이 시행령 §88 (2025-02-28 개정)
// 정확히 구현 확인. 그 위에 회귀 차단 + property-based invariant 추가.
//
// 13 신규 케이스 = 엣지 6 + Property-based 2 + 시나리오 5
// =============================================================================

describe('엣지 케이스 회귀 (Phase B robust 검증)', () => {
  it('Dust 매도 (1e-9 수량) — 부동소수점 정밀도', () => {
    // 매수 1 BTC, 1e-9 만큼 매도. 평균단가 50M, costBasis ≈ 0.05원.
    // 부동소수점 정밀도로 매도가 - costBasis 계산 시 -1 ~ +1원 범위 OK.
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-01-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 50_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1e-9,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000 * 1e-9, // ≈ 0.06원
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    expect(result.realizedGains).toHaveLength(1);
    // costBasis ≈ 1e-9 × 50M = 0.05, pnlKRW ≈ 0 (반올림)
    expect(Math.abs(result.realizedGains[0].pnlKRW)).toBeLessThanOrEqual(1);
    // 잔량 = 1 - 1e-9 ≈ 1 (dust 빠진 후)
    const btcHoldings = result.holdingsAfter.BTC;
    expect(btcHoldings).toBeDefined();
    expect(btcHoldings![0].amount).toBeGreaterThan(0.99);
  });

  it('동일 timestamp 다중 거래 — sort 안정성', () => {
    // 같은 timestamp 에 10 BUY + 1 SELL — sort 가 BUY 먼저 처리해야 평균단가 OK
    const sameTime = new Date('2027-03-15T00:00:00+09:00');
    const buys = Array.from({ length: 10 }, (_, i) =>
      tx({
        type: 'BUY',
        date: sameTime,
        amount: 0.1,
        pricePerUnitKRW: 50_000_000 + i * 1_000_000, // 50M, 51M, ..., 59M
        totalKRW: (50_000_000 + i * 1_000_000) * 0.1,
      }),
    );
    const result = calculateTax({
      transactions: [
        ...buys,
        tx({
          type: 'SELL',
          date: sameTime,
          amount: 0.5,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 30_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 총 BUY = 1 BTC, 총가 = 545M, 평균 = 54.5M
    // 매도 0.5 → 취득가 = 27.25M, 손익 = 30M - 27.25M = 2.75M
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].costBasisKRW).toBe(27_250_000);
    expect(result.realizedGains[0].pnlKRW).toBe(2_750_000);
  });

  it('의제+실가 mix — 한 결과에 두 코인 다른 처리', () => {
    // ETH 는 의제 50% 코인, BTC 는 평균법
    const result = calculateTax({
      transactions: [
        // BTC 평균법 — 손익 5M
        tx({
          type: 'BUY',
          coin: 'BTC',
          date: new Date('2027-01-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 50_000_000,
        }),
        tx({
          type: 'SELL',
          coin: 'BTC',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 55_000_000,
          totalKRW: 55_000_000,
        }),
        // ETH 의제 50% — 매수는 무시, 매도가액 × 50% = 손익
        tx({
          type: 'BUY',
          coin: 'ETH',
          date: new Date('2027-02-15T00:00:00+09:00'),
          amount: 10,
          pricePerUnitKRW: 3_000_000,
          totalKRW: 30_000_000,
        }),
        tx({
          type: 'SELL',
          coin: 'ETH',
          date: new Date('2027-07-01T00:00:00+09:00'),
          amount: 5,
          pricePerUnitKRW: 4_000_000,
          totalKRW: 20_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
      imputedExpenseCoins: new Set(['ETH']),
    });
    // BTC: 손익 5M
    // ETH 의제 50%: 매도가 20M × 50% = 손익 10M
    // 통산 = 15M
    expect(result.realizedGains).toHaveLength(2);
    const btcGain = result.realizedGains.find((g) => g.coin === 'BTC')!;
    const ethGain = result.realizedGains.find((g) => g.coin === 'ETH')!;
    expect(btcGain.pnlKRW).toBe(5_000_000);
    expect(ethGain.costBasisKRW).toBe(10_000_000); // 매도가 × 50%
    expect(ethGain.pnlKRW).toBe(10_000_000);
    expect(result.netPnLKRW).toBe(15_000_000);
  });

  it('KST 경계 BUY (2027-01-01 00:00 KST) — 시행 후 분류', () => {
    // 2027-01-01 00:00 KST = 2026-12-31 15:00 UTC. 시행 후 (>= 2027-01-01) 분류.
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-01-01T00:00:00+09:00'), // KST 자정 = 시행 첫 순간
          amount: 1,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 50_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 의제취득가액 적용 X (시행 후 매수라 실 매수가 사용)
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].costBasisKRW).toBe(50_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(10_000_000);
  });

  it('KST 경계 SELL (2027-12-31 23:59:59 KST) — 해당 연도 포함', () => {
    // 2027-12-31 23:59:59 KST = 2027-12-31 14:59:59 UTC. year=2027 매도로 분류.
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-01-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 50_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-12-31T23:59:59+09:00'), // 연도 마지막 1초
          amount: 1,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 2027 매도로 잡혀야 함
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].pnlKRW).toBe(10_000_000);
  });

  it('orphan SELL 다거래소 — warning 거래소별 분리', () => {
    // 매수 없이 SELL 2건 (Upbit, Binance) → 각각 orphan 손익 0, warning 거래소 모두 명시
    const result = calculateTax({
      transactions: [
        tx({
          type: 'SELL',
          coin: 'XRP',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1000,
          pricePerUnitKRW: 1000,
          totalKRW: 1_000_000,
          feeKRW: 1000,
          exchange: 'Upbit',
        }),
        tx({
          type: 'SELL',
          coin: 'XRP',
          date: new Date('2027-07-01T00:00:00+09:00'),
          amount: 500,
          pricePerUnitKRW: 1100,
          totalKRW: 550_000,
          feeKRW: 500,
          exchange: 'Binance',
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 2 orphan: 손익 0 - sellFee = 음수 (수수료만 손실)
    expect(result.realizedGains).toHaveLength(2);
    for (const g of result.realizedGains) {
      expect(g.pnlKRW).toBeLessThanOrEqual(0); // 수수료 만큼 손실
    }
    // warning 에 두 거래소 모두 등장
    const warningStr = result.warnings.join(' ');
    expect(warningStr).toContain('Upbit');
    expect(warningStr).toContain('Binance');
  });
});

describe('Property-based invariant (Phase B)', () => {
  it('totalGain + totalLoss === netPnL — 손익 통산 invariant', () => {
    // 다양한 매수·매도 mix. gain·loss·zero 모두 포함.
    const result = calculateTax({
      transactions: [
        // BTC: 손익 +20M
        tx({
          type: 'BUY',
          coin: 'BTC',
          date: new Date('2027-01-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 50_000_000,
        }),
        tx({
          type: 'SELL',
          coin: 'BTC',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 70_000_000,
          totalKRW: 70_000_000,
        }),
        // ETH: 손익 -5M
        tx({
          type: 'BUY',
          coin: 'ETH',
          date: new Date('2027-02-15T00:00:00+09:00'),
          amount: 10,
          pricePerUnitKRW: 4_000_000,
          totalKRW: 40_000_000,
        }),
        tx({
          type: 'SELL',
          coin: 'ETH',
          date: new Date('2027-07-01T00:00:00+09:00'),
          amount: 10,
          pricePerUnitKRW: 3_500_000,
          totalKRW: 35_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // totalGain - totalLoss 부호 정규화 후 합 = netPnL
    // (totalLossKRW 는 절댓값 양수로 저장, netPnLKRW 가 부호 있는 값)
    expect(result.totalGainKRW).toBe(20_000_000);
    expect(result.totalLossKRW).toBe(5_000_000);
    expect(result.netPnLKRW).toBe(15_000_000);
    // invariant: totalGain - totalLoss === netPnL
    expect(result.totalGainKRW - result.totalLossKRW).toBe(result.netPnLKRW);
  });

  it('holdingsAfter 잔량 === Σ(BUY) − Σ(SELL) — 잔량 invariant', () => {
    // BTC: BUY 3, SELL 1 → 잔량 2
    // ETH: BUY 20, SELL 5 → 잔량 15
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          coin: 'BTC',
          date: new Date('2027-01-15T00:00:00+09:00'),
          amount: 2,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 100_000_000,
        }),
        tx({
          type: 'BUY',
          coin: 'BTC',
          date: new Date('2027-03-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
        }),
        tx({
          type: 'SELL',
          coin: 'BTC',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 70_000_000,
          totalKRW: 70_000_000,
        }),
        tx({
          type: 'BUY',
          coin: 'ETH',
          date: new Date('2027-02-15T00:00:00+09:00'),
          amount: 20,
          pricePerUnitKRW: 4_000_000,
          totalKRW: 80_000_000,
        }),
        tx({
          type: 'SELL',
          coin: 'ETH',
          date: new Date('2027-07-01T00:00:00+09:00'),
          amount: 5,
          pricePerUnitKRW: 4_500_000,
          totalKRW: 22_500_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 잔량 invariant: BTC 2, ETH 15
    const btcAmount = result.holdingsAfter.BTC?.reduce(
      (s, l) => s + l.amount,
      0,
    );
    const ethAmount = result.holdingsAfter.ETH?.reduce(
      (s, l) => s + l.amount,
      0,
    );
    expect(btcAmount).toBeCloseTo(2, 8);
    expect(ethAmount).toBeCloseTo(15, 8);
  });
});

describe('회귀 시나리오 (Phase B)', () => {
  it('의제 50% 코인 단일 매도 — costBasis = totalKRW × 50% (§88④⑤)', () => {
    const result = calculateTax({
      transactions: [
        tx({
          type: 'SELL',
          coin: 'OBSCURE',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1000,
          pricePerUnitKRW: 100_000,
          totalKRW: 100_000_000, // 1억
        }),
      ],
      year: 2027,
      method: 'totalAverage',
      imputedExpenseCoins: new Set(['OBSCURE']),
    });
    // 의제 50%: costBasis = 1억 × 50% = 5천만, pnl = 1억 - 5천만 = 5천만
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].costBasisKRW).toBe(50_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(50_000_000);
    // 부대비용 불인정 — sellFeeKRW = 0
    expect(result.realizedGains[0].sellFeeKRW).toBe(0);
  });

  it('의제 50% + 평균법 코인 동시 — 통산·세액 정확', () => {
    const result = calculateTax({
      transactions: [
        // BTC 평균법 — 손익 10M
        tx({
          type: 'BUY',
          coin: 'BTC',
          date: new Date('2027-01-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 50_000_000,
        }),
        tx({
          type: 'SELL',
          coin: 'BTC',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
        }),
        // ALT 의제 50% — 매도가 20M × 50% = 10M
        tx({
          type: 'SELL',
          coin: 'ALT',
          date: new Date('2027-07-01T00:00:00+09:00'),
          amount: 100,
          pricePerUnitKRW: 200_000,
          totalKRW: 20_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
      imputedExpenseCoins: new Set(['ALT']),
    });
    // 통산 = 10M + 10M = 20M, 과세표준 = 20M - 250만 = 17.5M
    // 소득세 17.5M × 20% = 3.5M, 지방세 17.5M × 2% = 350K, 총 3.85M
    expect(result.netPnLKRW).toBe(20_000_000);
    expect(result.taxableIncomeKRW).toBe(17_500_000);
    expect(result.incomeTaxKRW).toBe(3_500_000);
    expect(result.localTaxKRW).toBe(350_000);
    expect(result.taxAmountKRW).toBe(3_850_000);
  });

  it('부분 매도 후 다음 해 carry → 동일 평균단가 유지', () => {
    // 2027: 매수 2 BTC @ 50M, 매도 1 BTC @ 70M. 잔량 1 BTC, 평균 50M carry-over.
    // 2028: 매수 1 BTC @ 100M, 매도 1 BTC @ 90M.
    //   2028 평균 = (1×50M + 1×100M) / 2 = 75M. 손익 = 90M - 75M = 15M.
    const result2028 = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-01-15T00:00:00+09:00'),
          amount: 2,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 100_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 70_000_000,
          totalKRW: 70_000_000,
        }),
        tx({
          type: 'BUY',
          date: new Date('2028-02-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 100_000_000,
          totalKRW: 100_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2028-06-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 90_000_000,
          totalKRW: 90_000_000,
        }),
      ],
      year: 2028,
      method: 'totalAverage',
    });
    // 2028 만 결과
    expect(result2028.realizedGains).toHaveLength(1);
    expect(result2028.realizedGains[0].costBasisKRW).toBe(75_000_000);
    expect(result2028.realizedGains[0].pnlKRW).toBe(15_000_000);
  });

  it('손실만 (모든 매도 손실) — 세액 0 + netPnL 음수', () => {
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-01-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 100_000_000,
          totalKRW: 100_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 손익 = 60M - 100M = -40M (손실)
    expect(result.realizedGains[0].pnlKRW).toBe(-40_000_000);
    expect(result.totalGainKRW).toBe(0);
    expect(result.totalLossKRW).toBe(40_000_000);
    expect(result.netPnLKRW).toBe(-40_000_000);
    // 세액 0 (손실은 공제 없이 0 처리)
    expect(result.taxableIncomeKRW).toBe(0);
    expect(result.taxAmountKRW).toBe(0);
    expect(result.incomeTaxKRW).toBe(0);
    expect(result.localTaxKRW).toBe(0);
  });

  it('대규모 거래 (50건) — perf + 정확성 sanity', () => {
    // 50 BUY @ 평균 50M, 1 SELL 25 BTC @ 70M
    const transactions: UnifiedTransaction[] = [];
    for (let i = 0; i < 50; i++) {
      transactions.push(
        tx({
          type: 'BUY',
          date: new Date(`2027-01-${String((i % 28) + 1).padStart(2, '0')}T00:00:00+09:00`),
          amount: 1,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 50_000_000,
        }),
      );
    }
    transactions.push(
      tx({
        type: 'SELL',
        date: new Date('2027-06-01T00:00:00+09:00'),
        amount: 25,
        pricePerUnitKRW: 70_000_000,
        totalKRW: 1_750_000_000,
      }),
    );
    const start = Date.now();
    const result = calculateTax({
      transactions,
      year: 2027,
      method: 'totalAverage',
    });
    const elapsed = Date.now() - start;
    // perf: 50 거래는 100ms 안에 처리 (충분한 margin)
    expect(elapsed).toBeLessThan(100);
    // 정확성: 평균 50M, 매도 25 → costBasis 1.25B, 손익 0.5B
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].costBasisKRW).toBe(1_250_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(500_000_000);
    // 잔량 25 BTC
    const btcAmount = result.holdingsAfter.BTC?.reduce(
      (s, l) => s + l.amount,
      0,
    );
    expect(btcAmount).toBeCloseTo(25, 8);
  });
});
