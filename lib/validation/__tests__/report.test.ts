import { describe, expect, it } from 'vitest';
import { reportRequestSchema } from '../report';

// 테스트 입력을 unknown으로 받아 partial mutation을 허용 (강한 타입 추론으로 인한 never[] 회피).
function validBody(): Record<string, unknown> {
  return {
    year: 2027,
    result: {
      year: 2027,
      totalGainKRW: 10_000_000,
      totalLossKRW: -2_000_000,
      netPnLKRW: 8_000_000,
      deductionKRW: 2_500_000,
      taxableIncomeKRW: 5_500_000,
      taxAmountKRW: 1_210_000,
      incomeTaxKRW: 1_100_000,
      localTaxKRW: 110_000,
      realizedGains: [] as unknown[],
      holdingsAfter: {} as Record<string, unknown>,
      summary: [] as unknown[],
      warnings: [] as unknown[],
      plan: 'premium',
      masked: false,
    } as Record<string, unknown>,
    transactions: [] as unknown[],
  };
}

describe('reportRequestSchema', () => {
  it('accepts a minimal valid payload', () => {
    const r = reportRequestSchema.safeParse(validBody());
    expect(r.success).toBe(true);
  });

  it('rejects NaN money', () => {
    const body = validBody();
    (body.result as Record<string, unknown>).totalGainKRW = Number.NaN;
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects Infinity', () => {
    const body = validBody();
    (body.result as Record<string, unknown>).taxAmountKRW = Number.POSITIVE_INFINITY;
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects summary length > 500', () => {
    const body = validBody();
    (body.result as Record<string, unknown>).summary = Array.from(
      { length: 501 },
      (_, i) => ({
        coin: `C${i}`,
        totalBuyKRW: 0,
        totalSellKRW: 0,
        realizedPnLKRW: 0,
        totalFeeKRW: 0,
        transactionCount: 0,
      }),
    );
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects transactions length > 10000', () => {
    const body = validBody();
    body.transactions = Array.from({ length: 10_001 }, (_, i) => ({
      id: String(i),
      date: '2027-01-01T00:00:00+09:00',
      type: 'BUY',
      coin: 'BTC',
      amount: 1,
      pricePerUnitKRW: 1,
      totalKRW: 1,
      feeKRW: 0,
      exchange: 'X',
      originalCurrency: 'KRW',
    }));
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects coin name longer than 16 chars', () => {
    const body = validBody();
    (body.result as Record<string, unknown>).summary = [
      {
        coin: 'VERYLONGCOINNAME12345',
        totalBuyKRW: 0,
        totalSellKRW: 0,
        realizedPnLKRW: 0,
        totalFeeKRW: 0,
        transactionCount: 0,
      },
    ];
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects coin name with disallowed characters', () => {
    const body = validBody();
    (body.result as Record<string, unknown>).summary = [
      {
        coin: 'BTC<script>',
        totalBuyKRW: 0,
        totalSellKRW: 0,
        realizedPnLKRW: 0,
        totalFeeKRW: 0,
        transactionCount: 0,
      },
    ];
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects holdingsAfter with more than 500 coin keys', () => {
    const body = validBody();
    const big: Record<string, unknown[]> = {};
    for (let i = 0; i < 501; i++) big[`C${i}`] = [];
    (body.result as Record<string, unknown>).holdingsAfter = big;
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects malformed ISO date in transactions', () => {
    const body = validBody();
    body.transactions = [
      {
        id: '1',
        date: '2027-01-01',
        type: 'BUY',
        coin: 'BTC',
        amount: 1,
        pricePerUnitKRW: 1,
        totalKRW: 1,
        feeKRW: 0,
        exchange: 'X',
        originalCurrency: 'KRW',
      },
    ];
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects year outside 2020..2030', () => {
    const body = validBody();
    body.year = 2019;
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
    body.year = 2031;
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });

  it('rejects fractional transactionCount', () => {
    const body = validBody();
    (body.result as Record<string, unknown>).summary = [
      {
        coin: 'BTC',
        totalBuyKRW: 0,
        totalSellKRW: 0,
        realizedPnLKRW: 0,
        totalFeeKRW: 0,
        transactionCount: 1.5,
      },
    ];
    expect(reportRequestSchema.safeParse(body).success).toBe(false);
  });
});
