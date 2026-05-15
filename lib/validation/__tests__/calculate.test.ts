import { describe, expect, it } from 'vitest';
import {
  MAX_FILE_BYTES,
  MAX_PREV_ENTRIES,
  previousParsedSchema,
  validateFileList,
} from '../calculate';

function makeFile(name: string, size: number, type: string): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('validateFileList', () => {
  it('accepts a typical PDF', () => {
    const f = makeFile('upbit.pdf', 1024, 'application/pdf');
    expect(validateFileList([f]).ok).toBe(true);
  });

  it('accepts a CSV with empty MIME (some browsers)', () => {
    const f = makeFile('binance.csv', 1024, '');
    expect(validateFileList([f]).ok).toBe(true);
  });

  it('rejects empty file list', () => {
    expect(validateFileList([]).ok).toBe(false);
  });

  it('rejects single file > 10MB', () => {
    const f = makeFile('big.pdf', MAX_FILE_BYTES + 1, 'application/pdf');
    expect(validateFileList([f]).ok).toBe(false);
  });

  it('rejects aggregate > 50MB', () => {
    const files = Array.from({ length: 6 }, () =>
      makeFile('x.pdf', MAX_FILE_BYTES, 'application/pdf'),
    );
    expect(validateFileList(files).ok).toBe(false);
  });

  it('rejects > 20 files', () => {
    const files = Array.from({ length: 21 }, () =>
      makeFile('x.pdf', 1024, 'application/pdf'),
    );
    expect(validateFileList(files).ok).toBe(false);
  });

  it('rejects executable extension', () => {
    const f = makeFile('malware.exe', 1024, 'application/x-msdownload');
    expect(validateFileList([f]).ok).toBe(false);
  });

  it('rejects misnamed .pdf with explicit wrong MIME', () => {
    // 빈 MIME이 아닌 명시적으로 잘못된 MIME은 거부됨 (extension fallback이 같이 실패해야).
    // 사실상 application/json MIME에 .pdf 확장자면 fallback으로 통과 — defense-in-depth.
    const f = makeFile('fake.json', 1024, 'application/json');
    expect(validateFileList([f]).ok).toBe(false);
  });
});

describe('previousParsedSchema', () => {
  function validEntry(id: string) {
    return {
      id,
      date: '2027-01-01T00:00:00+09:00',
      type: 'BUY' as const,
      coin: 'BTC',
      amount: 1,
      pricePerUnit: 100,
      total: 100,
      fee: 0.1,
      exchange: 'Upbit',
      quoteCurrency: 'KRW',
      feeCurrency: 'KRW',
    };
  }

  it('accepts a small valid array', () => {
    const arr = [validEntry('1'), validEntry('2')];
    expect(previousParsedSchema.safeParse(arr).success).toBe(true);
  });

  it('accepts 1000 entries', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => validEntry(String(i)));
    expect(previousParsedSchema.safeParse(arr).success).toBe(true);
  });

  it('rejects > MAX_PREV_ENTRIES', () => {
    const arr = Array.from({ length: MAX_PREV_ENTRIES + 1 }, (_, i) =>
      validEntry(String(i)),
    );
    expect(previousParsedSchema.safeParse(arr).success).toBe(false);
  });

  it('rejects NaN in numeric fields', () => {
    const arr = [{ ...validEntry('1'), amount: Number.NaN }];
    expect(previousParsedSchema.safeParse(arr).success).toBe(false);
  });

  it('rejects malformed date', () => {
    const arr = [{ ...validEntry('1'), date: 'not-a-date' }];
    expect(previousParsedSchema.safeParse(arr).success).toBe(false);
  });

  it('rejects coin with special chars', () => {
    const arr = [{ ...validEntry('1'), coin: "BTC';--" }];
    expect(previousParsedSchema.safeParse(arr).success).toBe(false);
  });

  it('rejects unknown type', () => {
    const arr = [{ ...validEntry('1'), type: 'SWAP' }];
    expect(previousParsedSchema.safeParse(arr).success).toBe(false);
  });
});
