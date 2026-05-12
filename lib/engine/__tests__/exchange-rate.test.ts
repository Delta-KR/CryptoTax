import { describe, it, expect } from 'vitest';
import {
  StaticExchangeRateProvider,
  toKSTDateStr,
} from '../exchange-rate';

describe('toKSTDateStr', () => {
  it('returns KST date for UTC near midnight (previous day rolls over)', () => {
    expect(toKSTDateStr(new Date('2027-04-13T15:00:00Z'))).toBe('2027-04-14');
  });

  it('returns same date when UTC is mid-day', () => {
    expect(toKSTDateStr(new Date('2027-04-14T12:00:00Z'))).toBe('2027-04-14');
  });
});

describe('StaticExchangeRateProvider', () => {
  it('returns exact rate when date+from+to match', async () => {
    const p = new StaticExchangeRateProvider([
      ['2027-04-14', 'USDT', 'KRW', 1488],
    ]);
    const r = await p.getRate(
      new Date('2027-04-14T00:00:00+09:00'),
      'USDT',
      'KRW',
    );
    expect(r).toBe(1488);
  });

  it('returns 1 when from === to (shortcut)', async () => {
    const p = new StaticExchangeRateProvider([]);
    expect(await p.getRate(new Date(), 'KRW', 'KRW')).toBe(1);
  });

  it('falls back to previous date when target date missing', async () => {
    const p = new StaticExchangeRateProvider([
      ['2027-04-09', 'USDT', 'KRW', 1480],
    ]);
    const r = await p.getRate(
      new Date('2027-04-12T05:00:00+09:00'),
      'USDT',
      'KRW',
    );
    expect(r).toBe(1480);
  });

  it('throws clear error when no rate within fallback window', async () => {
    const p = new StaticExchangeRateProvider([
      ['2027-01-01', 'USDT', 'KRW', 1400],
    ]);
    await expect(
      p.getRate(new Date('2027-12-01T00:00:00+09:00'), 'USDT', 'KRW'),
    ).rejects.toThrow(/누락/);
  });

  it('respects custom fallback window', async () => {
    const p = new StaticExchangeRateProvider(
      [['2027-04-01', 'USDT', 'KRW', 1400]],
      2,
    );
    await expect(
      p.getRate(new Date('2027-04-10T00:00:00+09:00'), 'USDT', 'KRW'),
    ).rejects.toThrow(/누락/);
  });
});
