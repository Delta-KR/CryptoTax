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
