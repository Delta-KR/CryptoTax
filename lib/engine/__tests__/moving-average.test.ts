import { describe, it, expect } from 'vitest';
import { MAEngine } from '../moving-average';
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

describe('MAEngine', () => {
  it('1. single buy then full sell: costBasis equals buy total', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 80_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.5);
    expect(result.costBasisKRW).toBe(40_000_000);
    expect(result.consumedLots).toHaveLength(1);
    expect(result.consumedLots[0].lotId).toBe('avg:BTC');
    expect(result.consumedLots[0].pricePerUnitKRW).toBe(80_000_000);
    expect(engine.getLotsByCoin('BTC')).toHaveLength(0);
  });

  it('2. single buy then partial sell: remaining state correct', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 1, pricePerUnitKRW: 50_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.4);
    expect(result.costBasisKRW).toBe(20_000_000);
    expect(engine.getLotsByCoin('BTC')[0].amount).toBeCloseTo(0.6, 8);
  });

  it('3. two buys same price → MA equals price (no FIFO advantage)', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 80_000_000 }),
    );
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 80_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.3);
    // avg = 80M, cost = 0.3 × 80M = 24M
    expect(result.costBasisKRW).toBe(24_000_000);
    expect(result.consumedLots[0].pricePerUnitKRW).toBe(80_000_000);
  });

  it('4. two buys different prices → MA uses weighted avg (≠ FIFO)', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 80_000_000 }),
    );
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 100_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.3);
    // avg = (0.5×80M + 0.5×100M) / 1.0 = 90M
    // cost = 0.3 × 90M = 27M
    expect(result.costBasisKRW).toBe(27_000_000);
    expect(result.consumedLots[0].pricePerUnitKRW).toBe(90_000_000);
    // remaining lots: 양쪽 모두 1 - 0.3 = 0.7 비율로 축소 → 각 0.35
    const lots = engine.getLotsByCoin('BTC');
    expect(lots).toHaveLength(2);
    expect(lots[0].amount).toBeCloseTo(0.35, 8);
    expect(lots[1].amount).toBeCloseTo(0.35, 8);
  });

  it('5. sell exceeds holdings: throws Insufficient lots', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 50_000_000 }),
    );
    expect(() => engine.consumeLots('BTC', 1.0)).toThrow(/Insufficient lots/);
  });

  it('6. BTC and ETH independent: consuming BTC does not affect ETH', () => {
    const engine = new MAEngine();
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

  it('7. decimal precision: 0.3 buy then 0.1 sell leaves 0.2', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.3, pricePerUnitKRW: 100_000_000 }),
    );
    engine.consumeLots('BTC', 0.1);
    expect(engine.getLotsByCoin('BTC')[0].amount).toBe(0.2);
  });

  it('8. exact full sell: coin removed from state', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 100_000_000 }),
    );
    engine.consumeLots('BTC', 0.5);
    expect(engine.getLotsByCoin('BTC')).toEqual([]);
    expect(engine.getHoldings().has('BTC')).toBe(false);
  });

  it('9. full sell then re-buy: new avg from re-buy only (no carryover)', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.5, pricePerUnitKRW: 100_000_000 }),
    );
    engine.consumeLots('BTC', 0.5);
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 0.2, pricePerUnitKRW: 110_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.1);
    // 이전 0.5 BTC 다 매도됨. 새 0.2 BTC만 보유 중. avg = 110M.
    expect(result.costBasisKRW).toBe(11_000_000);
    expect(result.consumedLots[0].pricePerUnitKRW).toBe(110_000_000);
  });

  it('10. fee proration: avg fee × sellAmount', () => {
    const engine = new MAEngine();
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
    // 평균 fee = 10000/1.0 = 10000 per BTC, sell 0.5 → buyFee = 5000
    expect(result.buyFeeKRW).toBe(5_000);
  });

  it('11. multiple sells reduce running totals correctly', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ coin: 'BTC', amount: 1.0, pricePerUnitKRW: 50_000_000 }),
    );
    engine.consumeLots('BTC', 0.3);
    engine.consumeLots('BTC', 0.3);
    const result = engine.consumeLots('BTC', 0.3);
    // 매번 0.3 매도, 각 cost = 0.3 × 50M = 15M (avg 그대로)
    expect(result.costBasisKRW).toBe(15_000_000);
    expect(engine.getLotsByCoin('BTC')[0].amount).toBeCloseTo(0.1, 8);
  });

  it('12. ConsumedLot has avg lotId regardless of underlying lot count', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({ id: 'a', coin: 'BTC', amount: 0.5, pricePerUnitKRW: 80_000_000 }),
    );
    engine.addLot(
      'BTC',
      makeLot({ id: 'b', coin: 'BTC', amount: 0.5, pricePerUnitKRW: 100_000_000 }),
    );
    const result = engine.consumeLots('BTC', 0.7);
    // FIFO와 달리 MA는 항상 단일 ConsumedLot 반환 — 평균 단가 적용 의미.
    expect(result.consumedLots).toHaveLength(1);
    expect(result.consumedLots[0].lotId).toBe('avg:BTC');
    // P1 #6: MA는 혼합 평균이라 매수일·거래소 단일값 불가능 → undefined.
    expect(result.consumedLots[0].buyDate).toBeUndefined();
    expect(result.consumedLots[0].exchange).toBeUndefined();
  });

  it('13. MA isDeemedCost = OR of underlying lots (any deemed → flag true)', () => {
    // P1 #7: MA의 의제 플래그는 underlying lots 중 하나라도 의제면 true.
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({
        coin: 'BTC',
        amount: 0.5,
        pricePerUnitKRW: 50_000_000,
        isDeemedCost: true, // pre-2027 매수 → 의제 시가 적용
      }),
    );
    engine.addLot(
      'BTC',
      makeLot({
        coin: 'BTC',
        amount: 0.5,
        pricePerUnitKRW: 100_000_000,
        isDeemedCost: false,
      }),
    );
    const result = engine.consumeLots('BTC', 0.3);
    expect(result.consumedLots[0].isDeemedCost).toBe(true);
  });

  it('14. MA isDeemedCost = false when no underlying lot is deemed', () => {
    const engine = new MAEngine();
    engine.addLot(
      'BTC',
      makeLot({
        coin: 'BTC',
        amount: 1,
        pricePerUnitKRW: 100_000_000,
        isDeemedCost: false,
      }),
    );
    const result = engine.consumeLots('BTC', 0.5);
    expect(result.consumedLots[0].isDeemedCost).toBe(false);
  });
});
