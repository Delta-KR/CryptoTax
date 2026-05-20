import { describe, it, expect } from 'vitest';
import { dedupeParsedTransactions } from '../dedupe';
import type { ParsedTransaction } from '../types';

let counter = 0;
function tx(p: Partial<ParsedTransaction> = {}): ParsedTransaction {
  return {
    id: `tx-${++counter}`, // uuid는 dedup에 영향 X — id는 매번 다름
    date: new Date('2027-06-01T10:00:00+09:00'),
    type: 'BUY',
    coin: 'BTC',
    amount: 0.1,
    pricePerUnit: 50_000_000,
    total: 5_000_000,
    fee: 0,
    exchange: 'Upbit',
    quoteCurrency: 'KRW',
    feeCurrency: 'KRW',
    ...p,
  };
}

describe('dedupeParsedTransactions', () => {
  it('빈 배열은 그대로 통과', () => {
    const r = dedupeParsedTransactions([]);
    expect(r.unique).toHaveLength(0);
    expect(r.duplicates).toBe(0);
  });

  it('완전히 같은 거래 2건 → 1건만 남고 duplicates=1 (id가 달라도)', () => {
    // 같은 파일을 두 번 업로드하면 parser가 새 uuid를 부여하지만 나머지는 동일.
    const a = tx({ id: 'a' });
    const b = tx({ id: 'b' });
    const r = dedupeParsedTransactions([a, b]);
    expect(r.unique).toHaveLength(1);
    expect(r.duplicates).toBe(1);
  });

  it('한 필드라도 다르면 중복 아님 — amount 다름', () => {
    const r = dedupeParsedTransactions([
      tx({ amount: 0.1 }),
      tx({ amount: 0.2 }),
    ]);
    expect(r.unique).toHaveLength(2);
    expect(r.duplicates).toBe(0);
  });

  it('한 필드라도 다르면 중복 아님 — exchange 다름', () => {
    const r = dedupeParsedTransactions([
      tx({ exchange: 'Upbit' }),
      tx({ exchange: 'Binance' }),
    ]);
    expect(r.unique).toHaveLength(2);
    expect(r.duplicates).toBe(0);
  });

  it('한 필드라도 다르면 중복 아님 — fee 다름', () => {
    const r = dedupeParsedTransactions([
      tx({ fee: 0 }),
      tx({ fee: 1 }),
    ]);
    expect(r.unique).toHaveLength(2);
    expect(r.duplicates).toBe(0);
  });

  it('한 필드라도 다르면 중복 아님 — 시간이 1초 다름', () => {
    const r = dedupeParsedTransactions([
      tx({ date: new Date('2027-06-01T10:00:00+09:00') }),
      tx({ date: new Date('2027-06-01T10:00:01+09:00') }),
    ]);
    expect(r.unique).toHaveLength(2);
    expect(r.duplicates).toBe(0);
  });

  it('isSwap 다름 → 중복 아님', () => {
    const r = dedupeParsedTransactions([
      tx({}),
      tx({ isSwap: true }),
    ]);
    expect(r.unique).toHaveLength(2);
    expect(r.duplicates).toBe(0);
  });

  it('previous 1건 + new 동일 1건 → 합쳤을 때 1건만 남음 (재업로드 시나리오)', () => {
    const previous = [tx({})];
    const newParsed = [tx({})];
    const r = dedupeParsedTransactions([...previous, ...newParsed]);
    expect(r.unique).toHaveLength(1);
    expect(r.duplicates).toBe(1);
  });

  it('순서 보존: 먼저 등장한 거래가 유지됨', () => {
    const first = tx({ id: 'first' });
    const second = tx({ id: 'second' });
    const r = dedupeParsedTransactions([first, second]);
    expect(r.unique[0].id).toBe('first');
  });

  it('부동소수점 — 같은 값 toFixed(10)로 정규화되어 false negative 없음', () => {
    // 0.1 + 0.2 === 0.30000000000000004 같은 사례에서도 toFixed(10)로 둘 다 '0.3000000000'
    const r = dedupeParsedTransactions([
      tx({ amount: 0.1 + 0.2 }),
      tx({ amount: 0.3 }),
    ]);
    // 정밀도가 10자리에서 다를 수 있으므로 — 이 케이스에서는 0.1+0.2 ≈ 0.3000000000(00004)
    // 둘 다 toFixed(10) = '0.3000000000' → 중복으로 인식
    expect(r.unique).toHaveLength(1);
    expect(r.duplicates).toBe(1);
  });
});
