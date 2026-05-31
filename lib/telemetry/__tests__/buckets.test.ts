import { describe, it, expect } from 'vitest';
import { toGainBucket, toTaxBucket } from '@/lib/telemetry/buckets';

describe('toGainBucket', () => {
  it('손실·0 은 none', () => {
    expect(toGainBucket(-1_000_000)).toBe('none');
    expect(toGainBucket(0)).toBe('none');
  });
  it('0 초과 ~ 250만 미만은 under_250', () => {
    expect(toGainBucket(1)).toBe('under_250');
    expect(toGainBucket(2_499_999)).toBe('under_250');
  });
  it('250만 경계는 under_1000 (공제 한도)', () => {
    expect(toGainBucket(2_500_000)).toBe('under_1000');
    expect(toGainBucket(9_999_999)).toBe('under_1000');
  });
  it('1천만 ~ 5천만 미만은 under_5000', () => {
    expect(toGainBucket(10_000_000)).toBe('under_5000');
    expect(toGainBucket(49_999_999)).toBe('under_5000');
  });
  it('5천만 이상은 over_5000 (고래 fat tail)', () => {
    expect(toGainBucket(50_000_000)).toBe('over_5000');
    expect(toGainBucket(100_000_000)).toBe('over_5000');
  });
});

describe('toTaxBucket', () => {
  it('0 이하는 none', () => {
    expect(toTaxBucket(-5)).toBe('none');
    expect(toTaxBucket(0)).toBe('none');
  });
  it('0 초과 ~ 100만 미만은 under_100', () => {
    expect(toTaxBucket(1)).toBe('under_100');
    expect(toTaxBucket(999_999)).toBe('under_100');
  });
  it('100만 ~ 500만 미만은 under_500', () => {
    expect(toTaxBucket(1_000_000)).toBe('under_500');
    expect(toTaxBucket(4_999_999)).toBe('under_500');
  });
  it('500만 ~ 2천만 미만은 under_2000 (구독 ROI)', () => {
    expect(toTaxBucket(5_000_000)).toBe('under_2000');
    expect(toTaxBucket(19_999_999)).toBe('under_2000');
  });
  it('2천만 이상은 over_2000', () => {
    expect(toTaxBucket(20_000_000)).toBe('over_2000');
    expect(toTaxBucket(99_999_999)).toBe('over_2000');
  });
});
