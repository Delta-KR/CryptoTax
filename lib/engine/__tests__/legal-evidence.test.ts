/**
 * 법령 evidence 기반 회귀 케이스 — (c) P2 검증 Phase D
 *
 * Phase B 가 엔진 robust 검증 (엣지 + property-based) 이라면,
 * Phase D 는 **공식 법령 조항 + 사용자 종합 가이드** 기반 시나리오.
 *
 * 각 케이스마다:
 * - 정확한 법령 조항 인용 (소득세법 / 시행령 / 지방세법)
 * - 사용자 가이드 (law/kontaxt_법률_가이드.md) 또는 공식 검증 문서
 *   (docs/tax-law-compliance.md v1.0) 의 evidence 인용
 *
 * vault 인덱싱: kontaxt-wiki/wiki/sources/
 * - 소득세법-시행령-88조-가상자산.md
 * - 소득세법-시행령-92조-평가법.md
 * - 소득세법-시행령-183조-비거주자.md
 * - vaupl-summary.md
 * - law-index-kontaxt.md
 */

import { describe, expect, it } from 'vitest';
import { calculateTax } from '../tax-calculator';
import { TAX_CONSTANTS } from '../constants';
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

describe('법령 evidence — 소득세법 §37⑤ 의제취득가액 Max(실, 시가)', () => {
  // 소득세법 §37⑤ — "시행 전 보유분의 의제취득가액 = Max(2026.12.31. 시가, 실제취득가액)"
  // 시행령 §88② — 2026-12-31 당시 시가 산정 방식 (시가고시사업자 평균)
  // 사용자 가이드: L154 — "시행 전 보유분 의제취득가액 = Max(2026.12.31. 시가, 실제취득가액)"
  // 인덱싱: vault sources/소득세법-시행령-88조-가상자산.md §88②

  it('실 매수가 < 시가 → 시가 적용 (의제 활성)', () => {
    const result = calculateTax({
      transactions: [
        // 시행 전 매수 — 실 매수가 30M, 시가는 50M
        tx({
          type: 'BUY',
          date: new Date('2026-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 30_000_000,
          totalKRW: 30_000_000,
        }),
        // 시행 후 매도 — 60M
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
      deemedCostPrices: new Map([['BTC', 50_000_000]]), // 2026-12-31 시가
    });
    // 의제: 50M 적용. 손익 = 60M − 50M = 10M
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].costBasisKRW).toBe(50_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(10_000_000);
  });

  it('실 매수가 > 시가 → 실 매수가 적용 (의제 비활성)', () => {
    const result = calculateTax({
      transactions: [
        // 시행 전 매수 — 실 매수가 60M, 시가는 50M
        tx({
          type: 'BUY',
          date: new Date('2026-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
        }),
        // 시행 후 매도 — 80M
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 80_000_000,
          totalKRW: 80_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
      deemedCostPrices: new Map([['BTC', 50_000_000]]), // 2026-12-31 시가
    });
    // 실 매수가 60M 적용 (시가 50M 보다 큼). 손익 = 80M − 60M = 20M
    expect(result.realizedGains[0].costBasisKRW).toBe(60_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(20_000_000);
  });
});

describe('법령 evidence — 소득세법 §37⑥ + 시행령 §88⑤ 필요경비 의제율 50%', () => {
  // 소득세법 §37⑥ — "취득가액 확인 곤란 시 양도가액 × 50% (부대비용 불산입)"
  // 시행령 §88⑤ — "100분의 50" 신설 2025-02-28 (확정)
  // 시행령 §88④ — 가상자산사업자 미경유 + 장부 미확인 케이스
  // 사용자 가이드: L155-156, L166 — "폴백 사유, 50% 비율 확정"
  // 인덱싱: vault sources/소득세법-시행령-88조-가상자산.md §88④⑤

  it('의제율 50% 적용 시 — costBasis = 매도가액 × 0.5, 부대비용 불산입', () => {
    const result = calculateTax({
      transactions: [
        // 의제 코인 매도 — 매수 기록 무시
        tx({
          type: 'SELL',
          coin: 'OBSCURE',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 100,
          pricePerUnitKRW: 1_000_000,
          totalKRW: 100_000_000,
          feeKRW: 50_000, // 매도 수수료 — 의제 시 불산입
        }),
      ],
      year: 2027,
      method: 'totalAverage',
      imputedExpenseCoins: new Set(['OBSCURE']),
    });
    // costBasis = 100M × 50% = 50M
    // pnl = 100M − 50M = 50M (부대비용 50K 불산입)
    expect(result.realizedGains[0].costBasisKRW).toBe(50_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(50_000_000);
    expect(result.realizedGains[0].sellFeeKRW).toBe(0); // §88⑤ 부대비용 불산입
  });

  it('의제율 50% 는 시행령 §88⑤ "100분의 50" 확정 — "최대 50%" 아님', () => {
    // 사용자 가이드 L166: "50% 비율 확정"
    // tax-law-compliance.md §3.4: "100분의 50 확정. '최대 50%' 아님"
    // 의제 50% 적용 시 항상 정확히 0.5 사용 — TAX_CONSTANTS 검증
    const sellAmount = 1_000_000_000; // 10억 매도
    const result = calculateTax({
      transactions: [
        tx({
          type: 'SELL',
          coin: 'TEST',
          amount: 1,
          totalKRW: sellAmount,
          feeKRW: 0,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
      imputedExpenseCoins: new Set(['TEST']),
    });
    expect(result.realizedGains[0].costBasisKRW).toBe(sellAmount * 0.5);
  });
});

describe('법령 evidence — 시행령 §88① + §92②4호 거주자 총평균법', () => {
  // 시행령 §88① (개정 2025-02-28) — "거주자별로 §92②4호 총평균법 적용"
  // 시행령 §92②4호 — "과세기간 개시일 재고 + 과세기간 취득 합계 ÷ 총수량 = 평균단가"
  // 사용자 가이드: L163 — "거주자별로 총평균법 적용 ⚠️ 과세개요 PDF는 옛 정보"
  // tax-law-compliance.md §2.3: "거주자별 통합 — 모든 거래소·지갑을 코인별로 통합"
  // 인덱싱: vault sources/소득세법-시행령-88조-가상자산.md §88① / 92조-평가법.md §92②4호

  it('다중 거래소 + 다중 매수 → 하나의 평균단가 적용 (거주자별 통합)', () => {
    const result = calculateTax({
      transactions: [
        // Upbit BTC 매수 1 @ 40M
        tx({
          type: 'BUY',
          date: new Date('2027-01-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 40_000_000,
          totalKRW: 40_000_000,
          exchange: 'Upbit',
        }),
        // Binance BTC 매수 1 @ 60M
        tx({
          type: 'BUY',
          date: new Date('2027-03-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
          exchange: 'Binance',
        }),
        // Bithumb BTC 매수 1 @ 80M
        tx({
          type: 'BUY',
          date: new Date('2027-05-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 80_000_000,
          totalKRW: 80_000_000,
          exchange: 'Bithumb',
        }),
        // Upbit BTC 매도 1.5 @ 100M
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          amount: 1.5,
          pricePerUnitKRW: 100_000_000,
          totalKRW: 150_000_000,
          exchange: 'Upbit',
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 거주자별 통합 평균 = (40M + 60M + 80M) / 3 = 60M/BTC
    // 매도 1.5 BTC → costBasis = 90M, 손익 = 150M − 90M = 60M
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].costBasisKRW).toBe(90_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(60_000_000);
  });
});

describe('법령 evidence — 소득세법 §64의3② 산출세액 + 250만원 공제', () => {
  // 소득세법 §64의3② — "(가상자산소득금액 − 250만원) × 20%"
  // 음수 시 max(0, ...) — 사용자 가이드 L170: "max(0, (가상자산소득금액 − 2,500,000)) × 0.22"
  // 인덱싱: vault sources/소득세법-시행령-88조-가상자산.md

  it('양도차익 > 250만원 → 과세 (소득세 20% + 지방세 2%)', () => {
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
          amount: 1,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 손익 10M, 공제 2.5M → 과세표준 7.5M
    // 소득세 7.5M × 20% = 1.5M, 지방세 7.5M × 2% = 150K, 합 1.65M
    expect(result.netPnLKRW).toBe(10_000_000);
    expect(result.deductionKRW).toBe(TAX_CONSTANTS.DEDUCTION_KRW); // 2,500,000
    expect(result.taxableIncomeKRW).toBe(7_500_000);
    expect(result.incomeTaxKRW).toBe(1_500_000); // 20%
    expect(result.localTaxKRW).toBe(150_000); // 2%
    expect(result.taxAmountKRW).toBe(1_650_000); // 22% 총
  });

  it('양도차익 ≤ 250만원 → 과세표준 0, 세액 0 (공제로 흡수)', () => {
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
          amount: 1,
          pricePerUnitKRW: 52_000_000,
          totalKRW: 52_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 손익 2M < 공제 2.5M → 과세표준 0
    expect(result.netPnLKRW).toBe(2_000_000);
    expect(result.taxableIncomeKRW).toBe(0); // max(0, 2M - 2.5M) = 0
    expect(result.taxAmountKRW).toBe(0);
  });

  it('순손실 → 세액 0 (§64의3② max(0, ...))', () => {
    // 사용자 가이드 L170: "max(0, ...)" 명시
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
          pricePerUnitKRW: 70_000_000,
          totalKRW: 70_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 손실 30M → 음수 netPnL, 세액 0
    expect(result.netPnLKRW).toBe(-30_000_000);
    expect(result.taxableIncomeKRW).toBe(0);
    expect(result.taxAmountKRW).toBe(0);
    expect(result.incomeTaxKRW).toBe(0);
    expect(result.localTaxKRW).toBe(0);
  });
});

describe('법령 evidence — 지방세법 §93 분리과세 지방소득세 2%', () => {
  // 지방세법 §93 [시행 2027-01-01] — "가상자산소득 개인지방소득세 = (기타소득금액 − 250만원) × 2%"
  // §95① — "거주자가 종합소득세 확정신고 시, 같은 기한까지 관할 지자체장에게 별도 확정신고·납부"
  // 사용자 가이드: L181-198 — "실효세율 22% (국세 20% + 지방세 2%) — 신고처 다름"
  // tax-law-compliance.md §3.3: 8군데 22% 단일 표기 → 분리 표기 권장

  it('지방세 = 과세표준 × 2% (소득세와 동일 base, 분리 계산)', () => {
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
          amount: 1,
          pricePerUnitKRW: 80_000_000,
          totalKRW: 80_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 손익 30M, 공제 2.5M → 과세표준 27.5M
    // 소득세 27.5M × 20% = 5.5M
    // 지방세 27.5M × 2% = 550K
    // 합 6.05M (실효세율 22%)
    expect(result.taxableIncomeKRW).toBe(27_500_000);
    expect(result.incomeTaxKRW).toBe(5_500_000);
    expect(result.localTaxKRW).toBe(550_000);
    // 비율 검증: localTax = incomeTax × 0.1 (지방세 = 소득세의 10%)
    expect(result.localTaxKRW).toBe(result.incomeTaxKRW * 0.1);
    // 실효세율 검증
    const effectiveRate =
      (result.incomeTaxKRW + result.localTaxKRW) / result.taxableIncomeKRW;
    expect(effectiveRate).toBeCloseTo(0.22, 10);
  });
});

describe('법령 evidence — 시행일 2027-01-01 부칙 (시행 전 비과세)', () => {
  // 소득세법 본법 부칙 (2022 신설) + 시행령 §88·§183 부칙
  // "[시행일: 2027. 1. 1.]" 명시 — 시행 전 거래는 비과세
  // 사용자 가이드: L147 "(모두 시행일 2027.1.1.)"
  // tax-law-compliance.md §2.2: "2027년 1월 1일 시점 보유분 → 의제취득가액"

  it('2026년 매도 → 비과세 (realizedGains 빈 배열, year=2026 요청)', () => {
    // 단, year=2027 요청 시 의제취득가액 carry 만 (잔량 처리)
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2026-01-15T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 30_000_000,
          totalKRW: 30_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2026-06-01T00:00:00+09:00'),
          amount: 1,
          pricePerUnitKRW: 50_000_000,
          totalKRW: 50_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
      deemedCostPrices: new Map([['BTC', 40_000_000]]),
    });
    // 시행 전 거래는 비과세 — 2027 result.realizedGains 빈 배열
    expect(result.realizedGains).toHaveLength(0);
    expect(result.netPnLKRW).toBe(0);
    expect(result.taxAmountKRW).toBe(0);
  });

  it('2027년 매수 + 매도 → 시행 후 과세 (의제취득가액 X, 실 매수가 사용)', () => {
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
          amount: 1,
          pricePerUnitKRW: 60_000_000,
          totalKRW: 60_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
      deemedCostPrices: new Map([['BTC', 100_000_000]]), // 의제 시가 (적용 안 됨 — 시행 후 매수)
    });
    // 시행 후 매수 → 실 매수가 50M 사용 (의제 100M 무시)
    expect(result.realizedGains[0].costBasisKRW).toBe(50_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(10_000_000);
  });
});

describe('법령 evidence — 손익 통산 (같은 과세기간 가산)', () => {
  // 시행령 §88① "거주자별" + §92②4호 "과세기간 단위" → 손익 통산
  // 사용자 가이드 L171: 가상자산소득금액 = 양도차익 - 양도차손 (자동 통산)
  // tax-law-compliance.md ✅3.1.6: "연간 손익 통산"
  // 인덱싱: vault sources/소득세법-시행령-88조-가상자산.md §88①

  it('한 코인 이익 + 다른 코인 손실 → 통산 (netPnL = gain - loss)', () => {
    const result = calculateTax({
      transactions: [
        // BTC: 손익 +30M
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
          pricePerUnitKRW: 80_000_000,
          totalKRW: 80_000_000,
        }),
        // ETH: 손익 -10M
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
          pricePerUnitKRW: 3_000_000,
          totalKRW: 30_000_000,
        }),
      ],
      year: 2027,
      method: 'totalAverage',
    });
    // 통산 = +30M - 10M = +20M
    expect(result.totalGainKRW).toBe(30_000_000);
    expect(result.totalLossKRW).toBe(10_000_000);
    expect(result.netPnLKRW).toBe(20_000_000);
    // 과세표준 = 20M - 2.5M = 17.5M
    expect(result.taxableIncomeKRW).toBe(17_500_000);
    expect(result.taxAmountKRW).toBe(17_500_000 * 0.22);
  });
});

describe('법령 evidence — 다년 carry-over (시행령 §92②4호)', () => {
  // 시행령 §92②4호 — "과세기간 종료일 재고가액" → 다음 과세기간 기초 보유
  // 시행령 §88① — 거주자별 → 다음 해 carry 도 거주자별 통합 유지
  // 사용자 가이드 + tax-law-compliance.md §2.2.3: "2027 잔량 → 2028 기초 보유 가액"

  it('2027 잔량 평균단가가 2028 기초 보유로 이월', () => {
    // 2027: 매수 2 BTC @ 50M, 매도 1 BTC @ 70M
    //   → 잔량 1 BTC, 평균 50M carry-over
    //   → 2027 손익 70M − 50M = 20M
    // 2028: 매수 1 BTC @ 100M, 매도 1 BTC @ 90M
    //   → 2028 평균 = (1×50M + 1×100M)/2 = 75M
    //   → 2028 손익 90M − 75M = 15M
    const transactions: UnifiedTransaction[] = [
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
    ];

    // 2027 검증
    const result2027 = calculateTax({
      transactions,
      year: 2027,
      method: 'totalAverage',
    });
    expect(result2027.realizedGains).toHaveLength(1);
    expect(result2027.realizedGains[0].pnlKRW).toBe(20_000_000);

    // 2028 검증 — 같은 transactions, year 만 다름
    const result2028 = calculateTax({
      transactions,
      year: 2028,
      method: 'totalAverage',
    });
    expect(result2028.realizedGains).toHaveLength(1);
    expect(result2028.realizedGains[0].costBasisKRW).toBe(75_000_000);
    expect(result2028.realizedGains[0].pnlKRW).toBe(15_000_000);
  });
});
