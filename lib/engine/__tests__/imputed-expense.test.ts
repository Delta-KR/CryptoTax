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

// 시행령 §88④⑤ — 필요경비 의제 50%.
// "동종 가상자산 전체에 적용" — 코인 단위 통째. 매도가액의 50%가 필요경비.
// 별도 부대비용 인정 안 함. 시가 의제(§37⑤)·평균단가(§88①) 모두 무시.
describe('필요경비 의제 50% (시행령 §88④⑤)', () => {
  describe('총평균법(거주자) 경로', () => {
    it('의제 코인의 매도는 매도가액의 50%가 손익', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 1,
            totalKRW: 80_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-09-01T00:00:00+09:00'),
            pricePerUnitKRW: 100_000_000,
            amount: 1,
            totalKRW: 100_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
        imputedExpenseCoins: new Set(['BTC']),
      });
      // 의제: costBasis = 100M × 0.5 = 50M, pnl = 50M
      expect(result.realizedGains).toHaveLength(1);
      expect(result.realizedGains[0].costBasisKRW).toBe(50_000_000);
      expect(result.realizedGains[0].pnlKRW).toBe(50_000_000);
      expect(result.realizedGains[0].sellFeeKRW).toBe(0); // 부대비용 불인정
      expect(result.warnings.some((w) => w.includes('필요경비 의제'))).toBe(true);
    });

    it('의제 + 비의제 코인 혼합 — 각각 다른 로직 적용', () => {
      const result = calculateTax({
        transactions: [
          // BTC: 의제 적용 — 매도가 × 50%
          tx({
            type: 'BUY',
            coin: 'BTC',
            date: new Date('2027-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 1,
            totalKRW: 80_000_000,
          }),
          tx({
            type: 'SELL',
            coin: 'BTC',
            date: new Date('2027-09-01T00:00:00+09:00'),
            pricePerUnitKRW: 120_000_000,
            amount: 1,
            totalKRW: 120_000_000,
          }),
          // ETH: 비의제 — 총평균법 적용
          tx({
            type: 'BUY',
            coin: 'ETH',
            date: new Date('2027-04-01T00:00:00+09:00'),
            pricePerUnitKRW: 4_000_000,
            amount: 10,
            totalKRW: 40_000_000,
          }),
          tx({
            type: 'SELL',
            coin: 'ETH',
            date: new Date('2027-10-01T00:00:00+09:00'),
            pricePerUnitKRW: 5_000_000,
            amount: 10,
            totalKRW: 50_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
        imputedExpenseCoins: new Set(['BTC']),
      });
      expect(result.realizedGains).toHaveLength(2);
      const btc = result.realizedGains.find((g) => g.coin === 'BTC')!;
      const eth = result.realizedGains.find((g) => g.coin === 'ETH')!;
      // BTC: 의제 — 120M × 0.5 = 60M
      expect(btc.pnlKRW).toBe(60_000_000);
      // ETH: 일반 — 50M - 40M = 10M
      expect(eth.pnlKRW).toBe(10_000_000);
    });

    it('의제 코인의 부대비용은 손익에 영향 없음', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'SELL',
            date: new Date('2027-06-01T00:00:00+09:00'),
            pricePerUnitKRW: 60_000_000,
            amount: 1,
            totalKRW: 60_000_000,
            feeKRW: 100_000, // 매도 수수료
          }),
        ],
        year: 2027,
        method: 'totalAverage',
        imputedExpenseCoins: new Set(['BTC']),
      });
      // 의제: 60M × 0.5 = 30M (수수료 무시)
      expect(result.realizedGains[0].pnlKRW).toBe(30_000_000);
      expect(result.realizedGains[0].sellFeeKRW).toBe(0);
    });

    it('의제 코인은 시가 의제(§37⑤) 무시', () => {
      const result = calculateTax({
        transactions: [
          // 시행 전 매수 — 의제 시가 70M, 실 매수가 40M (시가 의제로 70M 적용되어야 정상)
          tx({
            type: 'BUY',
            date: new Date('2026-08-01T00:00:00+09:00'),
            pricePerUnitKRW: 40_000_000,
            amount: 1,
            totalKRW: 40_000_000,
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
        imputedExpenseCoins: new Set(['BTC']),
      });
      // 의제 우선: 100M × 0.5 = 50M (시가 의제 70M 무시)
      expect(result.realizedGains[0].pnlKRW).toBe(50_000_000);
    });

    it('의제 코인의 잔량은 holdingsAfter에 없음 (lot 추적 X)', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 2,
            totalKRW: 160_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-09-01T00:00:00+09:00'),
            pricePerUnitKRW: 100_000_000,
            amount: 1,
            totalKRW: 100_000_000,
          }),
        ],
        year: 2027,
        method: 'totalAverage',
        imputedExpenseCoins: new Set(['BTC']),
      });
      expect(result.holdingsAfter.BTC).toBeUndefined();
      expect(result.warnings.some((w) => w.includes('BTC'))).toBe(true);
    });

    it('손익 통산: 의제 + 비의제 모두 합산 후 공제·세율', () => {
      const result = calculateTax({
        transactions: [
          // BTC 의제 — 매도가 1억, 의제 손익 5,000만
          tx({
            type: 'SELL',
            coin: 'BTC',
            date: new Date('2027-06-01T00:00:00+09:00'),
            pricePerUnitKRW: 100_000_000,
            amount: 1,
            totalKRW: 100_000_000,
          }),
          // ETH 비의제 — 매수 0, 매도 → orphan 0
        ],
        year: 2027,
        method: 'totalAverage',
        imputedExpenseCoins: new Set(['BTC']),
      });
      expect(result.netPnLKRW).toBe(50_000_000);
      // 50M - 2.5M 공제 = 47.5M 과세표준
      expect(result.taxableIncomeKRW).toBe(47_500_000);
      expect(result.incomeTaxKRW).toBe(9_500_000); // 20%
      expect(result.localTaxKRW).toBe(950_000); // 2%
      expect(result.taxAmountKRW).toBe(10_450_000);
    });
  });

  describe('FIFO 경로 (참고용)', () => {
    it('의제 코인의 매도는 동일하게 50% 적용', () => {
      const result = calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-03-01T00:00:00+09:00'),
            pricePerUnitKRW: 80_000_000,
            amount: 1,
            totalKRW: 80_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-09-01T00:00:00+09:00'),
            pricePerUnitKRW: 100_000_000,
            amount: 1,
            totalKRW: 100_000_000,
          }),
        ],
        year: 2027,
        method: 'fifo',
        imputedExpenseCoins: new Set(['BTC']),
      });
      expect(result.realizedGains[0].pnlKRW).toBe(50_000_000);
      expect(result.warnings.some((w) => w.includes('필요경비 의제'))).toBe(true);
    });
  });

  describe('미적용 (의제 코인 비활성)', () => {
    it('imputedExpenseCoins 미전달 시 기존 동작', () => {
      const transactions = [
        tx({
          type: 'BUY',
          date: new Date('2027-03-01T00:00:00+09:00'),
          pricePerUnitKRW: 80_000_000,
          amount: 1,
          totalKRW: 80_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-09-01T00:00:00+09:00'),
          pricePerUnitKRW: 100_000_000,
          amount: 1,
          totalKRW: 100_000_000,
        }),
      ];
      const noImputed = calculateTax({
        transactions,
        year: 2027,
        method: 'totalAverage',
      });
      const emptyImputed = calculateTax({
        transactions,
        year: 2027,
        method: 'totalAverage',
        imputedExpenseCoins: new Set(),
      });
      // 둘 다 정상 총평균법 (의제 미적용)
      expect(noImputed.realizedGains[0].pnlKRW).toBe(20_000_000);
      expect(emptyImputed.realizedGains[0].pnlKRW).toBe(20_000_000);
      expect(noImputed.warnings.every((w) => !w.includes('필요경비 의제'))).toBe(true);
    });
  });
});
