// 국세기본법 §47의2~4 — 양도소득세 가산세.
// 2027.01.01 시행 가상자산 양도소득세에도 동일 적용 (가상자산 전용 특수 가산세는 없음).
// 국세청 양도소득세 가산세 안내 참조.
//
// 활용처:
// - 결제 페이지 hero 동적 카피 (앵커 2 — "이 신고 누락 시 가산세 ₩XXX 회피")
// - 양도 시뮬레이터 페이지 ("지금 팔면 세금 ₩XXX, 신고 누락 시 ₩XXX 추가")
// - 사업계획서 (`docs/business-plan.md`) Section 4 앵커 2 근거

/**
 * 가산세 비율 — 산출세액 대비 비율 또는 일 단위 이자율.
 */
export const PENALTY_RATES = {
  // 무신고 가산세 — 국세기본법 §47의2
  NO_REPORT_REGULAR: 0.20, // 산출세액 × 20%
  NO_REPORT_FRAUD: 0.40, // 부정 무신고 — 산출세액 × 40%

  // 과소신고 가산세 — 국세기본법 §47의3
  UNDER_REPORT_REGULAR: 0.10, // 산출세액 × 10%
  UNDER_REPORT_FRAUD: 0.40, // 부정 과소신고 — 산출세액 × 40%

  // 납부지연 가산세 — 국세기본법 §47의4
  // 미납·미달납부세액 × 22/100,000/일 = 0.022%/일 (연 환산 약 8.03%)
  LATE_PAYMENT_DAILY: 0.00022,
  LATE_PAYMENT_ANNUAL: 0.0803,
} as const;

/**
 * 신고 누락 / 지연 시 추가 부담 추정 — 사용자 본인 행동에 따라 발생.
 *
 * 양도소득세 산출세액은 자동 계산되지만 가산세는 사용자가 신고를 안 했거나
 * 늦게 냈을 때 발생한다. 결제 페이지·시뮬레이터에서 loss aversion 카피의
 * 동적 숫자 (사용자 본인 데이터 기반 회피 가능액)에 사용한다.
 *
 * 무신고와 과소신고는 동시 발생 불가 (무신고면 신고 자체를 안 한 것 →
 * 과소신고 가산세는 적용되지 않음).
 *
 * @param taxAmount 산출세액 (KRW)
 * @param opts.noReport 무신고 여부
 * @param opts.fraud 부정 여부 (무신고·과소신고에 적용)
 * @param opts.underReport 과소신고 여부 (noReport 와 동시일 경우 무시)
 * @param opts.daysLate 납부지연 일수 (0 또는 미지정이면 0원)
 */
export function calculatePenalty(
  taxAmount: number,
  opts: {
    noReport?: boolean;
    fraud?: boolean;
    underReport?: boolean;
    daysLate?: number;
  } = {},
): {
  noReportPenalty: number;
  underReportPenalty: number;
  latePaymentPenalty: number;
  total: number;
} {
  const { noReport, fraud, underReport, daysLate } = opts;

  const noReportPenalty = noReport
    ? taxAmount * (fraud ? PENALTY_RATES.NO_REPORT_FRAUD : PENALTY_RATES.NO_REPORT_REGULAR)
    : 0;

  // 무신고와 과소신고는 동시 발생 불가.
  const underReportPenalty =
    underReport && !noReport
      ? taxAmount * (fraud ? PENALTY_RATES.UNDER_REPORT_FRAUD : PENALTY_RATES.UNDER_REPORT_REGULAR)
      : 0;

  const latePaymentPenalty =
    daysLate && daysLate > 0 ? taxAmount * PENALTY_RATES.LATE_PAYMENT_DAILY * daysLate : 0;

  return {
    noReportPenalty: Math.round(noReportPenalty),
    underReportPenalty: Math.round(underReportPenalty),
    latePaymentPenalty: Math.round(latePaymentPenalty),
    total: Math.round(noReportPenalty + underReportPenalty + latePaymentPenalty),
  };
}

/**
 * 양도차익에서 산출세액 + 무신고 가산세 시나리오 산출 (시뮬레이터·결제 페이지 카피용).
 *
 * 예: 양도차익 ₩10,000,000
 *   - 산출세액 = (10,000,000 − 2,500,000) × 22% (소득세 20% + 지방세 2%) = ₩1,650,000
 *   - 무신고 일반 = ₩330,000
 *   - 무신고 부정 = ₩660,000
 *   - 1년 지연 = ₩132,495
 *   - 무신고 + 1년 지연 = ₩462,495
 *
 * @param gainKRW 양도차익 (KRW). 250만원 공제 적용 전 raw 값.
 */
export function estimateTaxAndPenalty(gainKRW: number): {
  taxAmount: number;
  noReportRegular: number;
  noReportFraud: number;
  oneYearLate: number;
  totalIfNoReportOneYear: number;
} {
  // 인라인 상수 — lib/engine/constants.ts 의 TAX_CONSTANTS 와 일치.
  // 순환 import 방지 위해 인라인.
  const DEDUCTION = 2_500_000;
  const RATE = 0.22;

  const taxable = Math.max(0, gainKRW - DEDUCTION);
  const taxAmount = Math.round(taxable * RATE);
  const noReportRegular = Math.round(taxAmount * PENALTY_RATES.NO_REPORT_REGULAR);
  const noReportFraud = Math.round(taxAmount * PENALTY_RATES.NO_REPORT_FRAUD);
  const oneYearLate = Math.round(taxAmount * PENALTY_RATES.LATE_PAYMENT_ANNUAL);
  const totalIfNoReportOneYear = noReportRegular + oneYearLate;

  return {
    taxAmount,
    noReportRegular,
    noReportFraud,
    oneYearLate,
    totalIfNoReportOneYear,
  };
}
