import { describe, it, expect } from 'vitest';
import { applyDeemedCost, isPreDeemedDate } from '../deemed-cost';
import type { UnifiedTransaction } from '../types';

function tx(partial: Partial<UnifiedTransaction> = {}): UnifiedTransaction {
  return {
    id: 'tx-1',
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

describe('isPreDeemedDate', () => {
  it('returns true for 2026-12-31 23:59 KST', () => {
    expect(isPreDeemedDate(new Date('2026-12-31T23:59:00+09:00'))).toBe(true);
  });

  it('returns false at exact boundary 2027-01-01 00:00 KST', () => {
    expect(isPreDeemedDate(new Date('2027-01-01T00:00:00+09:00'))).toBe(false);
  });

  it('returns false for post-2027 dates', () => {
    expect(isPreDeemedDate(new Date('2028-06-15T12:00:00+09:00'))).toBe(false);
  });
});

describe('applyDeemedCost', () => {
  const snapshots = new Map([['BTC', 60_000_000]]);

  it('uses snapshot when snapshot > actual', () => {
    const r = applyDeemedCost(
      tx({
        date: new Date('2026-06-01T00:00:00+09:00'),
        pricePerUnitKRW: 40_000_000,
      }),
      snapshots,
    );
    expect(r.pricePerUnitKRW).toBe(60_000_000);
    expect(r.isDeemedCost).toBe(true);
  });

  it('uses actual when actual > snapshot', () => {
    const r = applyDeemedCost(
      tx({
        date: new Date('2026-06-01T00:00:00+09:00'),
        pricePerUnitKRW: 80_000_000,
      }),
      snapshots,
    );
    expect(r.pricePerUnitKRW).toBe(80_000_000);
    expect(r.isDeemedCost).toBe(true);
  });

  it('throws when pre-2027 BUY has no snapshot for coin', () => {
    expect(() =>
      applyDeemedCost(
        tx({
          coin: 'ETH',
          date: new Date('2026-06-01T00:00:00+09:00'),
        }),
        snapshots,
      ),
    ).toThrow(/시가가 누락/);
  });

  it('returns unchanged for post-2027 BUY', () => {
    const r = applyDeemedCost(
      tx({
        date: new Date('2027-06-01T00:00:00+09:00'),
        pricePerUnitKRW: 50_000_000,
      }),
      snapshots,
    );
    expect(r.pricePerUnitKRW).toBe(50_000_000);
    expect(r.isDeemedCost).toBe(false);
  });

  it('returns unchanged for SELL (any date)', () => {
    const r = applyDeemedCost(
      tx({
        type: 'SELL',
        date: new Date('2026-06-01T00:00:00+09:00'),
      }),
      snapshots,
    );
    expect(r.isDeemedCost).toBe(false);
    expect(r.pricePerUnitKRW).toBe(50_000_000);
  });
});
