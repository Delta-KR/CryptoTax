import { describe, it, expect } from 'vitest';
import { calculateTax, kstYear } from '../tax-calculator';
import type { UnifiedTransaction } from '../types';

function tx(partial: Partial<UnifiedTransaction> = {}): UnifiedTransaction {
  return {
    id: `tx-${Math.random()}`,
    date: new Date('2027-06-01T00:00:00+09:00'),
    type: 'BUY',
    coin: 'BTC',
    amount: 1,
    pricePerUnitKRW: 50_000_000,
    totalKRW: 50_000_000,
    feeKRW: 0,
    exchange: 'TEST',
    originalCurrency: 'KRW',
    ...partial,
  };
}

describe('kstYear', () => {
  it('returns 2027 for 2027-01-01 00:00 KST', () => {
    expect(kstYear(new Date('2027-01-01T00:00:00+09:00'))).toBe(2027);
  });

  it('returns 2026 for 2026-12-31 23:59 KST', () => {
    expect(kstYear(new Date('2026-12-31T23:59:00+09:00'))).toBe(2026);
  });
});

describe('calculateTax', () => {
  it('computes BUY then SELL with profit, applies deduction and 22% rate', () => {
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
          date: new Date('2027-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 100_000_000,
          amount: 1,
          totalKRW: 100_000_000,
        }),
      ],
      year: 2027,
    });
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].pnlKRW).toBe(20_000_000);
    expect(result.totalGainKRW).toBe(20_000_000);
    expect(result.netPnLKRW).toBe(20_000_000);
    expect(result.deductionKRW).toBe(2_500_000);
    expect(result.taxableIncomeKRW).toBe(17_500_000);
    expect(result.incomeTaxKRW).toBe(3_500_000);
    expect(result.localTaxKRW).toBe(350_000);
    expect(result.taxAmountKRW).toBe(3_850_000);
  });

  it('returns 0 tax when net PnL is below deduction', () => {
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-03-01T00:00:00+09:00'),
          totalKRW: 80_000_000,
          pricePerUnitKRW: 80_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          totalKRW: 81_000_000,
          pricePerUnitKRW: 81_000_000,
        }),
      ],
      year: 2027,
    });
    expect(result.netPnLKRW).toBe(1_000_000);
    expect(result.taxableIncomeKRW).toBe(0);
    expect(result.taxAmountKRW).toBe(0);
  });

  it('returns 0 tax when net PnL is negative', () => {
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-03-01T00:00:00+09:00'),
          totalKRW: 80_000_000,
          pricePerUnitKRW: 80_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          totalKRW: 70_000_000,
          pricePerUnitKRW: 70_000_000,
        }),
      ],
      year: 2027,
    });
    expect(result.netPnLKRW).toBe(-10_000_000);
    expect(result.taxableIncomeKRW).toBe(0);
    expect(result.taxAmountKRW).toBe(0);
  });

  it('applies FIFO order across multiple buys', () => {
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-01-01T00:00:00+09:00'),
          pricePerUnitKRW: 80_000_000,
          amount: 0.5,
          totalKRW: 40_000_000,
        }),
        tx({
          type: 'BUY',
          date: new Date('2027-02-01T00:00:00+09:00'),
          pricePerUnitKRW: 100_000_000,
          amount: 0.5,
          totalKRW: 50_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 90_000_000,
          amount: 0.7,
          totalKRW: 63_000_000,
        }),
      ],
      year: 2027,
    });
    expect(result.realizedGains[0].costBasisKRW).toBe(60_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(3_000_000);
  });

  it('only records realized gains for target year', () => {
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2026-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 80_000_000,
          totalKRW: 80_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2028-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 100_000_000,
          totalKRW: 100_000_000,
        }),
      ],
      year: 2027,
      deemedCostPrices: new Map([['BTC', 70_000_000]]),
    });
    expect(result.realizedGains).toHaveLength(0);
    expect(result.totalGainKRW).toBe(0);
  });

  it('applies deemed-cost for pre-2027 BUY (snapshot wins)', () => {
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2026-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 40_000_000,
          totalKRW: 40_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          pricePerUnitKRW: 100_000_000,
          totalKRW: 100_000_000,
        }),
      ],
      year: 2027,
      deemedCostPrices: new Map([['BTC', 60_000_000]]),
    });
    expect(result.realizedGains[0].costBasisKRW).toBe(60_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(40_000_000);
  });

  it('offsets loss against gain across coins', () => {
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-01-01T00:00:00+09:00'),
          coin: 'BTC',
          pricePerUnitKRW: 50_000_000,
          totalKRW: 50_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          coin: 'BTC',
          pricePerUnitKRW: 80_000_000,
          totalKRW: 80_000_000,
        }),
        tx({
          type: 'BUY',
          date: new Date('2027-01-01T00:00:00+09:00'),
          coin: 'ETH',
          pricePerUnitKRW: 5_000_000,
          totalKRW: 5_000_000,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          coin: 'ETH',
          pricePerUnitKRW: 4_000_000,
          totalKRW: 4_000_000,
        }),
      ],
      year: 2027,
    });
    expect(result.totalGainKRW).toBe(30_000_000);
    expect(result.totalLossKRW).toBe(1_000_000);
    expect(result.netPnLKRW).toBe(29_000_000);
  });

  it('builds CoinSummary with target-year-only aggregates', () => {
    const result = calculateTax({
      transactions: [
        tx({
          type: 'BUY',
          date: new Date('2027-01-01T00:00:00+09:00'),
          coin: 'BTC',
          totalKRW: 50_000_000,
          pricePerUnitKRW: 50_000_000,
          feeKRW: 100,
        }),
        tx({
          type: 'SELL',
          date: new Date('2027-06-01T00:00:00+09:00'),
          coin: 'BTC',
          totalKRW: 80_000_000,
          pricePerUnitKRW: 80_000_000,
          feeKRW: 200,
        }),
      ],
      year: 2027,
    });
    expect(result.summary).toHaveLength(1);
    const btc = result.summary[0];
    expect(btc.coin).toBe('BTC');
    expect(btc.totalBuyKRW).toBe(50_000_000);
    expect(btc.totalSellKRW).toBe(80_000_000);
    expect(btc.totalFeeKRW).toBe(300);
    expect(btc.transactionCount).toBe(2);
    expect(btc.realizedPnLKRW).toBe(29_999_700);
  });

  it('throws when SELL exceeds holdings', () => {
    expect(() =>
      calculateTax({
        transactions: [
          tx({
            type: 'BUY',
            date: new Date('2027-01-01T00:00:00+09:00'),
            amount: 0.5,
            totalKRW: 40_000_000,
          }),
          tx({
            type: 'SELL',
            date: new Date('2027-06-01T00:00:00+09:00'),
            amount: 1,
            totalKRW: 80_000_000,
          }),
        ],
        year: 2027,
      }),
    ).toThrow(/Insufficient lots/);
  });
});
