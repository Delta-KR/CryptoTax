import { describe, it, expect } from 'vitest';
import { normalize } from '../normalizer';
import { StaticExchangeRateProvider } from '../exchange-rate';
import { roundKRW } from '../constants';
import type { ParsedTransaction } from '../types';

function tx(partial: Partial<ParsedTransaction> = {}): ParsedTransaction {
  return {
    id: 'tx-1',
    date: new Date('2027-06-01T00:00:00+09:00'),
    type: 'BUY',
    coin: 'BTC',
    amount: 1,
    pricePerUnit: 50_000,
    total: 50_000,
    fee: 25,
    exchange: 'Binance',
    quoteCurrency: 'USDT',
    feeCurrency: 'USDT',
    ...partial,
  };
}

describe('normalize', () => {
  it('passes through KRW market without conversion', async () => {
    const rates = new StaticExchangeRateProvider([]);
    const parsed = [
      tx({
        coin: 'USDT',
        amount: 100,
        pricePerUnit: 1500,
        total: 150_000,
        fee: 75,
        quoteCurrency: 'KRW',
        feeCurrency: 'KRW',
        exchange: 'Upbit',
      }),
    ];
    const result = await normalize(parsed, rates);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerUnitKRW).toBe(1500);
    expect(result[0].totalKRW).toBe(150_000);
    expect(result[0].feeKRW).toBe(75);
    expect(result[0].originalCurrency).toBe('KRW');
  });

  it('converts USDT market via rate', async () => {
    const rates = new StaticExchangeRateProvider([
      ['2027-06-01', 'USDT', 'KRW', 1400],
    ]);
    const parsed = [
      tx({
        type: 'SELL',
        coin: 'BTC',
        amount: 0.001,
        pricePerUnit: 55_000,
        total: 55,
        fee: 0.055,
      }),
    ];
    const result = await normalize(parsed, rates);
    expect(result[0].pricePerUnitKRW).toBe(77_000_000);
    expect(result[0].totalKRW).toBe(77_000);
    expect(result[0].feeKRW).toBe(77);
  });

  it('splits coin-coin SWAP SELL into SELL base + BUY quote', async () => {
    const rates = new StaticExchangeRateProvider([
      ['2027-06-01', 'BTC', 'KRW', 50_000_000],
    ]);
    const parsed = [
      tx({
        type: 'SELL',
        coin: 'DUSK',
        amount: 190,
        pricePerUnit: 0.00000377,
        total: 0.0007163,
        fee: 0.00000072,
        quoteCurrency: 'BTC',
        feeCurrency: 'BTC',
        isSwap: true,
      }),
    ];
    const result = await normalize(parsed, rates);
    expect(result).toHaveLength(2);

    const sell = result.find((r) => r.coin === 'DUSK')!;
    expect(sell.type).toBe('SELL');
    expect(sell.amount).toBe(190);
    expect(sell.pricePerUnitKRW).toBe(roundKRW(0.00000377 * 50_000_000));
    expect(sell.totalKRW).toBe(roundKRW(190 * 0.00000377 * 50_000_000));
    expect(sell.feeKRW).toBe(roundKRW(0.00000072 * 50_000_000));

    const buy = result.find((r) => r.coin === 'BTC')!;
    expect(buy.type).toBe('BUY');
    expect(buy.amount).toBe(0.0007163);
    expect(buy.pricePerUnitKRW).toBe(50_000_000);
    expect(buy.totalKRW).toBe(roundKRW(0.0007163 * 50_000_000));
    expect(buy.feeKRW).toBe(0);
  });

  it('splits coin-coin SWAP BUY into SELL quote + BUY base', async () => {
    const rates = new StaticExchangeRateProvider([
      ['2027-06-01', 'BTC', 'KRW', 50_000_000],
    ]);
    const parsed = [
      tx({
        type: 'BUY',
        coin: 'DUSK',
        amount: 190,
        pricePerUnit: 0.00000377,
        total: 0.0007163,
        fee: 0.00000072,
        quoteCurrency: 'BTC',
        feeCurrency: 'BTC',
        isSwap: true,
      }),
    ];
    const result = await normalize(parsed, rates);
    expect(result).toHaveLength(2);

    const sell = result.find((r) => r.coin === 'BTC')!;
    expect(sell.type).toBe('SELL');
    expect(sell.amount).toBe(0.0007163);
    expect(sell.feeKRW).toBe(roundKRW(0.00000072 * 50_000_000));

    const buy = result.find((r) => r.coin === 'DUSK')!;
    expect(buy.type).toBe('BUY');
    expect(buy.amount).toBe(190);
    expect(buy.feeKRW).toBe(0);
  });

  it('sorts transactions by date asc', async () => {
    const rates = new StaticExchangeRateProvider([]);
    const parsed = [
      tx({
        id: 'a',
        date: new Date('2027-06-03T00:00:00+09:00'),
        coin: 'USDT',
        quoteCurrency: 'KRW',
        feeCurrency: 'KRW',
      }),
      tx({
        id: 'b',
        date: new Date('2027-06-01T00:00:00+09:00'),
        coin: 'USDT',
        quoteCurrency: 'KRW',
        feeCurrency: 'KRW',
      }),
      tx({
        id: 'c',
        date: new Date('2027-06-02T00:00:00+09:00'),
        coin: 'USDT',
        quoteCurrency: 'KRW',
        feeCurrency: 'KRW',
      }),
    ];
    const result = await normalize(parsed, rates);
    expect(result.map((r) => r.date.toISOString())).toEqual([
      '2027-05-31T15:00:00.000Z',
      '2027-06-01T15:00:00.000Z',
      '2027-06-02T15:00:00.000Z',
    ]);
  });

  it('on same timestamp, BUY comes before SELL', async () => {
    const rates = new StaticExchangeRateProvider([]);
    const sameDate = new Date('2027-06-01T00:00:00+09:00');
    const parsed = [
      tx({
        type: 'SELL',
        date: sameDate,
        coin: 'USDT',
        quoteCurrency: 'KRW',
        feeCurrency: 'KRW',
      }),
      tx({
        type: 'BUY',
        date: sameDate,
        coin: 'USDT',
        quoteCurrency: 'KRW',
        feeCurrency: 'KRW',
      }),
    ];
    const result = await normalize(parsed, rates);
    expect(result[0].type).toBe('BUY');
    expect(result[1].type).toBe('SELL');
  });

  it('handles fee in different currency than quote', async () => {
    const rates = new StaticExchangeRateProvider([
      ['2027-06-01', 'USDT', 'KRW', 1400],
      ['2027-06-01', 'BNB', 'KRW', 800_000],
    ]);
    const parsed = [
      tx({
        type: 'BUY',
        coin: 'BTC',
        amount: 0.001,
        pricePerUnit: 55_000,
        total: 55,
        fee: 0.01,
        feeCurrency: 'BNB',
      }),
    ];
    const result = await normalize(parsed, rates);
    expect(result[0].feeKRW).toBe(roundKRW(0.01 * 800_000));
  });
});
