import { describe, it, expect } from 'vitest';
import { FIFOEngine } from '../fifo';
import type { Lot } from '../types';

let lotCounter = 0;
function makeLot(
  partial: Partial<Lot> & {
    coin: string;
    amount: number;
    pricePerUnitKRW: number;
  },
): Lot {
  const amount = partial.amount;
  return {
    id: partial.id ?? `lot-${++lotCounter}`,
    coin: partial.coin,
    amount,
    originalAmount: partial.originalAmount ?? amount,
    pricePerUnitKRW: partial.pricePerUnitKRW,
    totalCostKRW: partial.totalCostKRW ?? amount * partial.pricePerUnitKRW,
    feeKRW: partial.feeKRW ?? 0,
    date: partial.date ?? new Date('2027-01-01'),
    exchange: partial.exchange ?? 'TEST',
    isDeemedCost: partial.isDeemedCost ?? false,
  };
}

describe('FIFOEngine', () => {
  it('1. single buy then full sell: costBasis equals buy total, lots empty', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 80_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.5);
    expect(result.costBasisKRW).toBe(40_000_000);
    expect(result.consumedLots).toHaveLength(1);
    expect(engine.getLotsByCoin('BTC')).toHaveLength(0);
  });

  it('2. single buy then partial sell: remaining lot amount correct', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 1, pricePerUnitKRW: 50_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.4);
    expect(result.costBasisKRW).toBe(20_000_000);
    expect(result.consumedLots).toHaveLength(1);
    expect(engine.getLotsByCoin('BTC')[0].amount).toBeCloseTo(0.6, 8);
  });

  it('3. two lots different prices: partial sell stays in first lot', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 80_000_000 }),
    );
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 100_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.3);
    expect(result.costBasisKRW).toBe(24_000_000);
    expect(result.consumedLots).toHaveLength(1);
    expect(engine.getLotsByCoin('BTC')).toHaveLength(2);
    expect(engine.getLotsByCoin('BTC')[0].amount).toBeCloseTo(0.2, 8);
  });

  it('4. two lots: sell spans both, first consumed fully, second partially', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 80_000_000 }),
    );
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 100_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.7);
    expect(result.costBasisKRW).toBe(60_000_000);
    expect(result.consumedLots).toHaveLength(2);
    expect(engine.getLotsByCoin('BTC')).toHaveLength(1);
    expect(engine.getLotsByCoin('BTC')[0].amount).toBeCloseTo(0.3, 8);
  });

  it('5. sell amount exceeds holdings: throws Insufficient lots', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 50_000_000 }),
    );
    expect(() => engine.consumeLots('BTC', 1.0)).toThrow(
      /Insufficient lots/,
    );
  });

  it('6. BTC and ETH independent: consuming BTC does not affect ETH', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 1, pricePerUnitKRW: 50_000_000 }),
    );
    engine.addLot(
      'ETH',
      makeLot({ coin: 'ETH', amount: 10, pricePerUnitKRW: 3_000_000 }),
    );
    engine.consumeLots('BTC', 0.5);
    expect(engine.getLotsByCoin('BTC')[0].amount).toBeCloseTo(0.5, 8);
    expect(engine.getLotsByCoin('ETH')[0].amount).toBe(10);
  });

  it('7. decimal precision: 0.3 buy then 0.1 sell leaves exactly 0.2', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.3, pricePerUnitKRW: 100_000_000 }),
    );
    engine.consumeLots('BTC', 0.1);
    expect(engine.getLotsByCoin('BTC')[0].amount).toBe(0.2);
  });

  it('8. addLot then consumeLots at same timestamp: consume succeeds', () => {
    const engine = new FIFOEngine();
    const date = new Date('2027-03-01T00:00:00Z');
    engine.addLot(
      'BTC',
      makeLot({
        coin: 'BTC',
        amount: 0.5,
        pricePerUnitKRW: 100_000_000,
        date,
      }),
    );
    const result = engine.consumeLots('BTC', 0.5);
    expect(result.costBasisKRW).toBe(50_000_000);
  });

  it('9. exact full sell: lots for coin become empty', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 100_000_000 }),
    );
    engine.consumeLots('BTC', 0.5);
    expect(engine.getLotsByCoin('BTC')).toEqual([]);
  });

  it('10. full sell then re-buy: new lot stands alone', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 100_000_000 }),
    );
    engine.consumeLots('BTC', 0.5);
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.2, pricePerUnitKRW: 110_000_000 }),
    );
    const remaining = engine.getLotsByCoin('BTC');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].pricePerUnitKRW).toBe(110_000_000);
    expect(remaining[0].amount).toBe(0.2);
  });

  it('11. ConsumedLot fields match expected lotId/amount/cost per slice', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({
        id: 'lot-A',
        coin: 'BTC',
        amount: 0.5,
        pricePerUnitKRW: 80_000_000,
      }),
    );
    engine.addLot(
      'BTC',
      makeLot({
        id: 'lot-B',
        coin: 'BTC',
        amount: 0.5,
        pricePerUnitKRW: 100_000_000,
      }),
    );
    const result = engine.consumeLots('BTC', 0.7);
    expect(result.consumedLots[0]).toEqual({
      lotId: 'lot-A',
      amount: 0.5,
      pricePerUnitKRW: 80_000_000,
      costKRW: 40_000_000,
    });
    expect(result.consumedLots[1]).toEqual({
      lotId: 'lot-B',
      amount: 0.2,
      pricePerUnitKRW: 100_000_000,
      costKRW: 20_000_000,
    });
  });

  it('12. proportional fee allocation across partial sells', () => {
    const engine = new FIFOEngine();
    engine.addLot(
      'BTC',
      makeLot({
        coin: 'BTC',
        amount: 1,
        pricePerUnitKRW: 100_000_000,
        feeKRW: 10_000,
      }),
    );
    const result = engine.consumeLots('BTC', 0.5);
    expect(result.buyFeeKRW).toBe(5_000);
  });
});
