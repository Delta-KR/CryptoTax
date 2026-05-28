import { describe, expect, it } from 'vitest';
import { calculateTax } from '../tax-calculator';
import type { UnifiedTransaction } from '../types';

// docs/legal-review/scenarios/01~10*.md 의 모든 expected value 가
// 실제 엔진 output 과 일치하는지 회귀 검증.
// 외부 세무사 검증 의뢰 전 self-check 역할 — 문서와 엔진 drift 즉시 감지.

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

describe('legal-review scenarios — expected value 회귀 (외부 검증 패키지)', () => {
  // ─────────────────────────────────────────────────────────
  // 시나리오 #1 — 단일 거래소 단순 매수·매도
  // docs/legal-review/scenarios/01-basic-buy-sell.md
  // ─────────────────────────────────────────────────────────
  describe('#1 단일 거래소 단순 매수·매도 (BTC)', () => {
    const transactions: UnifiedTransaction[] = [
      tx({ date: new Date('2027-01-15T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000 }),
      tx({ date: new Date('2027-03-20T14:15:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 60_000_000, totalKRW: 3_000_000, feeKRW: 3_000 }),
      tx({ date: new Date('2027-06-10T09:45:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 70_000_000, totalKRW: 3_500_000, feeKRW: 3_500 }),
      tx({ date: new Date('2027-09-15T16:20:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000 }),
      tx({ date: new Date('2027-11-30T11:00:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 90_000_000, totalKRW: 4_500_000, feeKRW: 4_500 }),
    ];

    it('매도별 손익 + 합계 세액 (문서 expected 와 일치)', () => {
      const result = calculateTax({ transactions, year: 2027, method: 'totalAverage' });
      // avg = 11,511,500 / 0.20 = 57,557,500
      expect(result.realizedGains).toHaveLength(2);
      // 매도 #4: pnl = 8,000,000 - 5,755,750 - 8,000 = 2,236,250
      expect(result.realizedGains[0].pnlKRW).toBe(2_236_250);
      // 매도 #5: pnl = 4,500,000 - 2,877,875 - 4,500 = 1,617,625
      expect(result.realizedGains[1].pnlKRW).toBe(1_617_625);
      // 합계
      expect(result.netPnLKRW).toBe(3_853_875);
      expect(result.taxableIncomeKRW).toBe(1_353_875);
      expect(result.incomeTaxKRW).toBe(270_775);
      expect(result.localTaxKRW).toBe(27_078);
      expect(result.taxAmountKRW).toBe(297_853);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 시나리오 #2 — 의제 코인 매도 (필요경비 의제 50%)
  // docs/legal-review/scenarios/02-imputed-expense.md
  // ─────────────────────────────────────────────────────────
  describe('#2 의제 코인 매도 (BTC 일반 + ETH 의제)', () => {
    const transactions: UnifiedTransaction[] = [
      tx({ date: new Date('2027-01-15T10:30:00+09:00'), type: 'BUY', coin: 'BTC', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000 }),
      tx({ date: new Date('2027-02-10T11:00:00+09:00'), type: 'BUY', coin: 'ETH', amount: 1, pricePerUnitKRW: 4_000_000, totalKRW: 4_000_000, feeKRW: 4_000 }),
      tx({ date: new Date('2027-03-20T14:15:00+09:00'), type: 'BUY', coin: 'BTC', amount: 0.05, pricePerUnitKRW: 60_000_000, totalKRW: 3_000_000, feeKRW: 3_000 }),
      tx({ date: new Date('2027-05-15T09:00:00+09:00'), type: 'BUY', coin: 'ETH', amount: 2, pricePerUnitKRW: 5_000_000, totalKRW: 10_000_000, feeKRW: 10_000 }),
      tx({ date: new Date('2027-07-10T16:20:00+09:00'), type: 'SELL', coin: 'BTC', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000 }),
      tx({ date: new Date('2027-09-20T11:00:00+09:00'), type: 'SELL', coin: 'ETH', amount: 2, pricePerUnitKRW: 6_000_000, totalKRW: 12_000_000, feeKRW: 12_000 }),
      tx({ date: new Date('2027-11-15T13:30:00+09:00'), type: 'SELL', coin: 'ETH', amount: 1, pricePerUnitKRW: 7_000_000, totalKRW: 7_000_000, feeKRW: 7_000 }),
    ];

    it('BTC 총평균법 + ETH 의제 50% 동시 처리', () => {
      const result = calculateTax({
        transactions,
        year: 2027,
        method: 'totalAverage',
        imputedExpenseCoins: new Set(['ETH']),
      });
      // BTC pnl(#5): 8,000,000 - 0.10 × 53,386,666.67 - 8,000 = 2,653,333
      // ETH pnl(#6): 12,000,000 - 6,000,000 = 6,000,000 (의제 50% 가 매도 수수료 포함)
      // ETH pnl(#7): 7,000,000 - 3,500,000 = 3,500,000
      const pnls = result.realizedGains.map((g) => g.pnlKRW).sort((a, b) => a - b);
      expect(pnls).toEqual([2_653_333, 3_500_000, 6_000_000]);
      expect(result.netPnLKRW).toBe(12_153_333);
      expect(result.taxableIncomeKRW).toBe(9_653_333);
      // 9,653,333 × 20% = 1,930,666.6 → 1,930,667 (round)
      expect(result.incomeTaxKRW).toBe(1_930_667);
      // 1,930,667 × 10% = 193,066.7 → 193,067 (round)
      expect(result.localTaxKRW).toBe(193_067);
      expect(result.taxAmountKRW).toBe(2_123_734);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 시나리오 #3 — 시행 전 보유분 의제취득가액
  // docs/legal-review/scenarios/03-deemed-cost.md
  // ─────────────────────────────────────────────────────────
  describe('#3 시행 전 보유분 의제취득가액 (BTC)', () => {
    const transactions: UnifiedTransaction[] = [
      tx({ date: new Date('2026-03-15T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 40_000_000, totalKRW: 4_000_000, feeKRW: 4_000 }),
      tx({ date: new Date('2026-09-20T14:15:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 50_000_000, totalKRW: 2_500_000, feeKRW: 2_500 }),
      tx({ date: new Date('2027-02-15T09:00:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 70_000_000, totalKRW: 3_500_000, feeKRW: 3_500 }),
      tx({ date: new Date('2027-08-10T16:20:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000 }),
      tx({ date: new Date('2027-12-15T11:00:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 90_000_000, totalKRW: 4_500_000, feeKRW: 4_500 }),
    ];

    it('시행 전 매수의 의제취득가액 max(실가, 시가) 적용', () => {
      const result = calculateTax({
        transactions,
        year: 2027,
        method: 'totalAverage',
        deemedCostPrices: new Map([['BTC', 60_000_000]]),
      });
      // 시행 전 carry: (0.10 × 60M + 4K) + (0.05 × 60M + 2.5K) = 9,006,500
      // 2027 매수: 0.05 × 70M + 3.5K = 3,503,500
      // avg = 12,510,000 / 0.20 = 62,550,000
      // pnl(#4): 8,000,000 - 6,255,000 - 8,000 = 1,737,000
      // pnl(#5): 4,500,000 - 3,127,500 - 4,500 = 1,368,000
      const pnls = result.realizedGains.map((g) => g.pnlKRW).sort((a, b) => a - b);
      expect(pnls).toEqual([1_368_000, 1_737_000]);
      expect(result.netPnLKRW).toBe(3_105_000);
      expect(result.taxableIncomeKRW).toBe(605_000);
      expect(result.incomeTaxKRW).toBe(121_000);
      expect(result.localTaxKRW).toBe(12_100);
      expect(result.taxAmountKRW).toBe(133_100);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 시나리오 #4 — 해외 거래소 USD 일별 환율 (KRW 환산 후)
  // docs/legal-review/scenarios/04-fx-conversion.md
  // ─────────────────────────────────────────────────────────
  describe('#4 Binance USDT 거래 (KRW 환산 후)', () => {
    // 환율 변환은 parser 단계에서 KRW 로 변환된 값을 input 으로 사용.
    // 시나리오 문서의 변환 결과: 5,200,000+5,200 / 3,375,000+3,375 / 9,800,000+9,800
    const transactions: UnifiedTransaction[] = [
      tx({ date: new Date('2027-02-10T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 52_000_000, totalKRW: 5_200_000, feeKRW: 5_200, exchange: 'Binance', originalCurrency: 'USDT' }),
      tx({ date: new Date('2027-06-15T14:15:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 67_500_000, totalKRW: 3_375_000, feeKRW: 3_375, exchange: 'Binance', originalCurrency: 'USDT' }),
      tx({ date: new Date('2027-10-20T16:20:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 98_000_000, totalKRW: 9_800_000, feeKRW: 9_800, exchange: 'Binance', originalCurrency: 'USDT' }),
    ];

    it('KRW 환산 후 총평균법 적용', () => {
      const result = calculateTax({ transactions, year: 2027, method: 'totalAverage' });
      // avg = 8,583,575 / 0.15 = 57,223,833.33
      // pnl: 9,800,000 - 5,722,383.33 - 9,800 = 4,067,817 (round)
      expect(result.realizedGains).toHaveLength(1);
      expect(result.realizedGains[0].pnlKRW).toBe(4_067_817);
      expect(result.netPnLKRW).toBe(4_067_817);
      expect(result.taxableIncomeKRW).toBe(1_567_817);
      expect(result.incomeTaxKRW).toBe(313_563);
      expect(result.localTaxKRW).toBe(31_356);
      expect(result.taxAmountKRW).toBe(344_919);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 시나리오 #5 — 다년 손익 통산 (carry-over)
  // docs/legal-review/scenarios/05-carry-over.md
  // ⚠ 결손금 carry-over 는 엔진 밖. 연도별 양도손익만 검증.
  // ─────────────────────────────────────────────────────────
  describe('#5 다년 손익 (연도별 양도손익만 — 결손금 carry 는 엔진 외부)', () => {
    const transactions: UnifiedTransaction[] = [
      tx({ date: new Date('2027-03-15T10:00:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000 }),
      tx({ date: new Date('2027-10-20T10:00:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000 }),
      tx({ date: new Date('2028-04-10T10:00:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 70_000_000, totalKRW: 3_500_000, feeKRW: 3_500 }),
      tx({ date: new Date('2028-11-15T10:00:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 100_000_000, totalKRW: 5_000_000, feeKRW: 5_000 }),
      tx({ date: new Date('2029-05-20T10:00:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 60_000_000, totalKRW: 3_000_000, feeKRW: 3_000 }),
      tx({ date: new Date('2029-12-10T10:00:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 200_000_000, totalKRW: 10_000_000, feeKRW: 10_000 }),
    ];

    it('2027 양도손익 −3,013,000 (손실)', () => {
      const r = calculateTax({ transactions, year: 2027, method: 'totalAverage' });
      expect(r.realizedGains[0].pnlKRW).toBe(-3_013_000);
      expect(r.netPnLKRW).toBe(-3_013_000);
    });

    it('2028 양도손익 +1,491,500', () => {
      const r = calculateTax({ transactions, year: 2028, method: 'totalAverage' });
      expect(r.realizedGains[0].pnlKRW).toBe(1_491_500);
      expect(r.netPnLKRW).toBe(1_491_500);
    });

    it('2029 양도손익 +6,987,000', () => {
      const r = calculateTax({ transactions, year: 2029, method: 'totalAverage' });
      expect(r.realizedGains[0].pnlKRW).toBe(6_987_000);
      expect(r.netPnLKRW).toBe(6_987_000);
    });

    // 결손금 5년 이월 통산은 사용자/CPA 수동 적용 영역.
    // 문서 #5 의 최종 세액 (652,410) 은 엔진 단독으로는 산출 불가.
  });

  // ─────────────────────────────────────────────────────────
  // 시나리오 #6 — 다거래소 + orphan 매도
  // docs/legal-review/scenarios/06-multi-exchange-orphan.md
  // ─────────────────────────────────────────────────────────
  describe('#6 다거래소 + orphan (Upbit BUY + Bithumb 누락 매도)', () => {
    const transactions: UnifiedTransaction[] = [
      tx({ date: new Date('2027-02-15T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000, exchange: 'Upbit' }),
      tx({ date: new Date('2027-05-20T14:15:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000, exchange: 'Upbit' }),
      tx({ date: new Date('2027-08-10T16:20:00+09:00'), type: 'SELL', amount: 0.05, pricePerUnitKRW: 90_000_000, totalKRW: 4_500_000, feeKRW: 4_500, exchange: 'Bithumb' }),
    ];

    it('정상 매도 + orphan 매도 (수수료만 손실)', () => {
      const result = calculateTax({ transactions, year: 2027, method: 'totalAverage' });
      // avg = 5,005,000 / 0.10 = 50,050,000
      // 매도 #2 (정상): 8,000,000 - 5,005,000 - 8,000 = 2,987,000
      // 매도 #3 (orphan): -4,500 (매도 수수료만)
      expect(result.realizedGains).toHaveLength(2);
      const pnls = result.realizedGains.map((g) => g.pnlKRW).sort((a, b) => a - b);
      expect(pnls).toEqual([-4_500, 2_987_000]);
      expect(result.netPnLKRW).toBe(2_982_500);
      expect(result.taxableIncomeKRW).toBe(482_500);
      expect(result.incomeTaxKRW).toBe(96_500);
      expect(result.localTaxKRW).toBe(9_650);
      expect(result.taxAmountKRW).toBe(106_150);
      // orphan warning 출력 확인
      expect(result.warnings.some((w) => w.includes('보유량을 초과'))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 시나리오 #7 — KST 경계 거래 (시행일 부칙)
  // docs/legal-review/scenarios/07-kst-boundary.md
  // ─────────────────────────────────────────────────────────
  describe('#7 KST 경계 거래 (시행 전·후 판정)', () => {
    const transactions: UnifiedTransaction[] = [
      // KST 2026-12-31 23:30 = UTC 2026-12-31 14:30 → 시행 전
      tx({ date: new Date('2026-12-31T23:30:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 50_000_000, totalKRW: 2_500_000, feeKRW: 5_000 }),
      // KST 2027-01-01 00:30 = UTC 2026-12-31 15:30 → 시행 후
      tx({ date: new Date('2027-01-01T00:30:00+09:00'), type: 'BUY', amount: 0.05, pricePerUnitKRW: 55_000_000, totalKRW: 2_750_000, feeKRW: 5_500 }),
      tx({ date: new Date('2027-06-15T14:00:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 100_000_000, totalKRW: 10_000_000, feeKRW: 10_000 }),
    ];

    it('KST 기준 시행 전 → 의제취득가액, 시행 후 → 실가', () => {
      const result = calculateTax({
        transactions,
        year: 2027,
        method: 'totalAverage',
        deemedCostPrices: new Map([['BTC', 60_000_000]]),
      });
      // 시행 전 carry: 0.05 × 60M + 5K = 3,005,000
      // 2027 매수: 0.05 × 55M + 5.5K = 2,755,500
      // avg = 5,760,500 / 0.10 = 57,605,000
      // pnl: 10,000,000 - 5,760,500 - 10,000 = 4,229,500
      expect(result.realizedGains).toHaveLength(1);
      expect(result.realizedGains[0].pnlKRW).toBe(4_229_500);
      expect(result.netPnLKRW).toBe(4_229_500);
      expect(result.taxableIncomeKRW).toBe(1_729_500);
      expect(result.incomeTaxKRW).toBe(345_900);
      expect(result.localTaxKRW).toBe(34_590);
      expect(result.taxAmountKRW).toBe(380_490);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 시나리오 #8 — 동일 timestamp 합산
  // docs/legal-review/scenarios/08-same-timestamp.md
  // ─────────────────────────────────────────────────────────
  describe('#8 동일 timestamp 5건 합산 정확성', () => {
    const sameTime = new Date('2027-03-10T14:00:00+09:00');
    const transactions: UnifiedTransaction[] = [
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 50_000_000, totalKRW: 1_000_000, feeKRW: 1_000 }),
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 51_000_000, totalKRW: 1_020_000, feeKRW: 1_000 }),
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 52_000_000, totalKRW: 1_040_000, feeKRW: 1_000 }),
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 53_000_000, totalKRW: 1_060_000, feeKRW: 1_000 }),
      tx({ date: sameTime, type: 'BUY', amount: 0.02, pricePerUnitKRW: 54_000_000, totalKRW: 1_080_000, feeKRW: 1_000 }),
      tx({ date: new Date('2027-10-15T11:00:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 150_000_000, totalKRW: 15_000_000, feeKRW: 15_000 }),
    ];

    it('정렬 순서 무관 합산 평균', () => {
      const result = calculateTax({ transactions, year: 2027, method: 'totalAverage' });
      // avg = 5,205,000 / 0.10 = 52,050,000
      // pnl: 15,000,000 - 5,205,000 - 15,000 = 9,780,000
      expect(result.realizedGains).toHaveLength(1);
      expect(result.realizedGains[0].pnlKRW).toBe(9_780_000);
      expect(result.netPnLKRW).toBe(9_780_000);
      expect(result.taxableIncomeKRW).toBe(7_280_000);
      expect(result.incomeTaxKRW).toBe(1_456_000);
      expect(result.localTaxKRW).toBe(145_600);
      expect(result.taxAmountKRW).toBe(1_601_600);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 시나리오 #9 — 거래소 간 이동 (transfer 무시)
  // docs/legal-review/scenarios/09-cross-exchange-transfer.md
  // ─────────────────────────────────────────────────────────
  describe('#9 거래소 간 이동 (Upbit BUY → Bithumb SELL 자연 매칭)', () => {
    const transactions: UnifiedTransaction[] = [
      tx({ date: new Date('2027-02-15T10:30:00+09:00'), type: 'BUY', amount: 0.1, pricePerUnitKRW: 50_000_000, totalKRW: 5_000_000, feeKRW: 5_000, exchange: 'Upbit' }),
      // transfer (출금·입금) 라인은 input 에 없음 — Kontaxt 가 자동 제외
      tx({ date: new Date('2027-08-10T16:20:00+09:00'), type: 'SELL', amount: 0.1, pricePerUnitKRW: 80_000_000, totalKRW: 8_000_000, feeKRW: 8_000, exchange: 'Bithumb' }),
    ];

    it('거주자별 통합 평균단가가 다른 거래소 매도에 적용', () => {
      const result = calculateTax({ transactions, year: 2027, method: 'totalAverage' });
      // avg = 5,005,000 / 0.10 = 50,050,000
      // pnl: 8,000,000 - 5,005,000 - 8,000 = 2,987,000
      expect(result.realizedGains).toHaveLength(1);
      expect(result.realizedGains[0].pnlKRW).toBe(2_987_000);
      expect(result.netPnLKRW).toBe(2_987_000);
      expect(result.taxableIncomeKRW).toBe(487_000);
      expect(result.incomeTaxKRW).toBe(97_400);
      expect(result.localTaxKRW).toBe(9_740);
      expect(result.taxAmountKRW).toBe(107_140);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 시나리오 #10 — BTC(시행전 의제+실가) + ETH(의제) + DOGE(의제) mix
  // docs/legal-review/scenarios/10-mixed-treatment.md
  // ─────────────────────────────────────────────────────────
  describe('#10 다중 처리 방식 동시 적용 (의제취득가액 + 의제 50% mix)', () => {
    const transactions: UnifiedTransaction[] = [
      tx({ date: new Date('2026-09-15T10:30:00+09:00'), type: 'BUY', coin: 'BTC', amount: 0.05, pricePerUnitKRW: 40_000_000, totalKRW: 2_000_000, feeKRW: 4_000 }),
      tx({ date: new Date('2027-02-10T11:00:00+09:00'), type: 'BUY', coin: 'ETH', amount: 1, pricePerUnitKRW: 4_000_000, totalKRW: 4_000_000, feeKRW: 4_000 }),
      tx({ date: new Date('2027-04-20T14:15:00+09:00'), type: 'BUY', coin: 'BTC', amount: 0.05, pricePerUnitKRW: 70_000_000, totalKRW: 3_500_000, feeKRW: 3_500 }),
      tx({ date: new Date('2027-06-15T09:00:00+09:00'), type: 'BUY', coin: 'DOGE', amount: 100, pricePerUnitKRW: 1_000, totalKRW: 100_000, feeKRW: 100 }),
      tx({ date: new Date('2027-09-10T16:20:00+09:00'), type: 'SELL', coin: 'BTC', amount: 0.1, pricePerUnitKRW: 90_000_000, totalKRW: 9_000_000, feeKRW: 9_000 }),
      tx({ date: new Date('2027-11-20T11:00:00+09:00'), type: 'SELL', coin: 'ETH', amount: 1, pricePerUnitKRW: 6_000_000, totalKRW: 6_000_000, feeKRW: 6_000 }),
      tx({ date: new Date('2027-12-15T13:30:00+09:00'), type: 'SELL', coin: 'DOGE', amount: 100, pricePerUnitKRW: 1_500, totalKRW: 150_000, feeKRW: 150 }),
    ];

    it('BTC 총평균(+의제취득가) + ETH·DOGE 의제 50%', () => {
      const result = calculateTax({
        transactions,
        year: 2027,
        method: 'totalAverage',
        deemedCostPrices: new Map([['BTC', 60_000_000]]),
        imputedExpenseCoins: new Set(['ETH', 'DOGE']),
      });
      // BTC: carry 0.05 × 60M + 4K = 3,004,000 / 2027 매수 0.05 × 70M + 3.5K = 3,503,500
      //      avg = 6,507,500 / 0.10 = 65,075,000
      //      pnl(#5): 9,000,000 - 6,507,500 - 9,000 = 2,483,500
      // ETH: pnl(#6) = 6,000,000 - 3,000,000 = 3,000,000 (의제 50% 가 매도 수수료 포함)
      // DOGE: pnl(#7) = 150,000 - 75,000 = 75,000
      const pnls = result.realizedGains.map((g) => g.pnlKRW).sort((a, b) => a - b);
      expect(pnls).toEqual([75_000, 2_483_500, 3_000_000]);
      expect(result.netPnLKRW).toBe(5_558_500);
      expect(result.taxableIncomeKRW).toBe(3_058_500);
      // 3,058,500 × 20% = 611,700 (정수)
      expect(result.incomeTaxKRW).toBe(611_700);
      expect(result.localTaxKRW).toBe(61_170);
      expect(result.taxAmountKRW).toBe(672_870);
    });
  });
});
