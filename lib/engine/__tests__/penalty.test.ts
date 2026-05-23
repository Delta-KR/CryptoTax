import { describe, it, expect } from 'vitest';
import { PENALTY_RATES, calculatePenalty, estimateTaxAndPenalty } from '../penalty';

describe('PENALTY_RATES — 국세기본법 §47의2~4 기준', () => {
  it('무신고 가산세 일반 20% / 부정 40%', () => {
    expect(PENALTY_RATES.NO_REPORT_REGULAR).toBe(0.2);
    expect(PENALTY_RATES.NO_REPORT_FRAUD).toBe(0.4);
  });

  it('과소신고 가산세 일반 10% / 부정 40%', () => {
    expect(PENALTY_RATES.UNDER_REPORT_REGULAR).toBe(0.1);
    expect(PENALTY_RATES.UNDER_REPORT_FRAUD).toBe(0.4);
  });

  it('납부지연 일 0.022% (연 환산 약 8.03%)', () => {
    expect(PENALTY_RATES.LATE_PAYMENT_DAILY).toBe(0.00022);
    expect(PENALTY_RATES.LATE_PAYMENT_ANNUAL).toBeCloseTo(0.0803, 4);
  });
});

describe('calculatePenalty', () => {
  const taxAmount = 1_650_000; // 양도차익 1,000만 → 산출세액

  it('무신고 일반: 산출세액 × 20%', () => {
    const r = calculatePenalty(taxAmount, { noReport: true });
    expect(r.noReportPenalty).toBe(330_000);
    expect(r.underReportPenalty).toBe(0);
    expect(r.latePaymentPenalty).toBe(0);
    expect(r.total).toBe(330_000);
  });

  it('무신고 부정: 산출세액 × 40%', () => {
    const r = calculatePenalty(taxAmount, { noReport: true, fraud: true });
    expect(r.noReportPenalty).toBe(660_000);
    expect(r.total).toBe(660_000);
  });

  it('과소신고 일반: 산출세액 × 10%', () => {
    const r = calculatePenalty(taxAmount, { underReport: true });
    expect(r.underReportPenalty).toBe(165_000);
    expect(r.noReportPenalty).toBe(0);
  });

  it('과소신고 부정: 산출세액 × 40%', () => {
    const r = calculatePenalty(taxAmount, { underReport: true, fraud: true });
    expect(r.underReportPenalty).toBe(660_000);
  });

  it('무신고가 우선 — noReport + underReport 동시 → 무신고만 적용', () => {
    const r = calculatePenalty(taxAmount, { noReport: true, underReport: true });
    expect(r.noReportPenalty).toBe(330_000);
    expect(r.underReportPenalty).toBe(0);
  });

  it('납부지연 365일 ≈ 8.03%', () => {
    const r = calculatePenalty(taxAmount, { daysLate: 365 });
    // 1,650,000 × 0.00022 × 365 = 132,495
    expect(r.latePaymentPenalty).toBe(132_495);
    expect(r.noReportPenalty).toBe(0);
  });

  it('납부지연 0일 또는 미지정 → 0', () => {
    expect(calculatePenalty(taxAmount, { daysLate: 0 }).latePaymentPenalty).toBe(0);
    expect(calculatePenalty(taxAmount).latePaymentPenalty).toBe(0);
  });

  it('무신고 + 1년 지연 결합: 총 ₩462,495', () => {
    const r = calculatePenalty(taxAmount, { noReport: true, daysLate: 365 });
    expect(r.noReportPenalty).toBe(330_000);
    expect(r.latePaymentPenalty).toBe(132_495);
    expect(r.total).toBe(462_495);
  });

  it('옵션 모두 false/미지정 → 모두 0', () => {
    const r = calculatePenalty(taxAmount);
    expect(r.total).toBe(0);
  });
});

describe('estimateTaxAndPenalty — 시뮬레이터·결제 페이지 카피용', () => {
  it('양도차익 1,000만원: 산출세액 ₩1,650,000', () => {
    const r = estimateTaxAndPenalty(10_000_000);
    expect(r.taxAmount).toBe(1_650_000);
    expect(r.noReportRegular).toBe(330_000);
    expect(r.noReportFraud).toBe(660_000);
    expect(r.oneYearLate).toBe(132_495);
    expect(r.totalIfNoReportOneYear).toBe(462_495);
  });

  it('양도차익 250만원 (공제 한도): 산출세액 0', () => {
    const r = estimateTaxAndPenalty(2_500_000);
    expect(r.taxAmount).toBe(0);
    expect(r.noReportRegular).toBe(0);
    expect(r.totalIfNoReportOneYear).toBe(0);
  });

  it('양도차익 0: 모두 0', () => {
    const r = estimateTaxAndPenalty(0);
    expect(r.taxAmount).toBe(0);
    expect(r.totalIfNoReportOneYear).toBe(0);
  });

  it('양도차익 5,000만원: 산출세액 ₩10,450,000', () => {
    const r = estimateTaxAndPenalty(50_000_000);
    // (50,000,000 − 2,500,000) × 0.22 = 10,450,000
    expect(r.taxAmount).toBe(10_450_000);
    expect(r.noReportRegular).toBe(2_090_000);
  });

  it('음수 양도차익 (방어): 산출세액 0', () => {
    const r = estimateTaxAndPenalty(-1_000_000);
    expect(r.taxAmount).toBe(0);
  });
});
