import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  parseText as parseBinanceSpot,
  binanceSpotParser,
} from '../binance-spot.parser';
import {
  parseText as parseUpbit,
  upbitParser,
  looksLikeUpbitTransactionPdf,
} from '../upbit.parser';
import {
  parseFile,
  isBinanceFutures,
  isBinanceOrderHistory,
  findParser,
} from '../registry';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, 'fixtures');

function readFixture(name: string): string {
  return readFileSync(resolve(fixturesDir, name), 'utf-8');
}

describe('Binance Spot parseText', () => {
  it('parses USDT pair SELL row', () => {
    const text = `Time,Pair,Side,Price,Executed,Amount,Fee
27-07-05 12:07:20,BTCUSDT,SELL,55607.31,0.00093BTC,51.7147983USDT,0.0517148USDT`;
    const txs = parseBinanceSpot(text);
    expect(txs).toHaveLength(1);
    const tx = txs[0];
    expect(tx.type).toBe('SELL');
    expect(tx.coin).toBe('BTC');
    expect(tx.amount).toBe(0.00093);
    expect(tx.pricePerUnit).toBe(55607.31);
    expect(tx.total).toBe(51.7147983);
    expect(tx.fee).toBe(0.0517148);
    expect(tx.quoteCurrency).toBe('USDT');
    expect(tx.feeCurrency).toBe('USDT');
    expect(tx.isSwap).toBeUndefined();
    expect(tx.exchange).toBe('Binance');
  });

  it('parses ETHUSDT BUY row', () => {
    const text = `Time,Pair,Side,Price,Executed,Amount,Fee
27-08-15 14:30:00,ETHUSDT,BUY,3200.50,0.5ETH,1600.25USDT,1.60025USDT`;
    const txs = parseBinanceSpot(text);
    expect(txs[0].type).toBe('BUY');
    expect(txs[0].coin).toBe('ETH');
    expect(txs[0].amount).toBe(0.5);
  });

  it('parses coin-coin pair (DUSKBTC) with isSwap=true', () => {
    const text = `Time,Pair,Side,Price,Executed,Amount,Fee
27-07-05 12:06:30,DUSKBTC,SELL,0.00000377,190DUSK,0.0007163BTC,0.00000072BTC`;
    const txs = parseBinanceSpot(text);
    expect(txs[0].coin).toBe('DUSK');
    expect(txs[0].amount).toBe(190);
    expect(txs[0].quoteCurrency).toBe('BTC');
    expect(txs[0].feeCurrency).toBe('BTC');
    expect(txs[0].isSwap).toBe(true);
  });

  it('parses date as KST (UTC+9)', () => {
    const text = `Time,Pair,Side,Price,Executed,Amount,Fee
27-07-05 12:07:20,BTCUSDT,SELL,55607.31,0.00093BTC,51.7147983USDT,0.0517148USDT`;
    const txs = parseBinanceSpot(text);
    expect(txs[0].date.toISOString()).toBe('2027-07-05T03:07:20.000Z');
  });

  it('throws clear error on Binance Futures CSV', () => {
    const text = `Uid,Time,Symbol,Side,Price,Quantity,Amount,Fee,Realized Profit,Buyer,Maker,Trade ID,Order ID
123,27-06-29 19:43:24,ETHUSDT,BUY,3395.66,0.006,20.37396,0.01018698 USDT,0,TRUE,FALSE,4,8`;
    expect(() => parseBinanceSpot(text)).toThrow(/선물/);
  });

  it('throws on unknown header', () => {
    expect(() => parseBinanceSpot('Foo,Bar,Baz\n1,2,3')).toThrow(/헤더/);
  });

  it('returns empty array for empty input', () => {
    expect(parseBinanceSpot('')).toEqual([]);
  });

  it('parses fixture file with 3 rows', () => {
    const csv = readFixture('binance-spot-sample.csv');
    const txs = parseBinanceSpot(csv);
    expect(txs).toHaveLength(3);
    expect(txs[0].coin).toBe('BTC');
    expect(txs[1].coin).toBe('DUSK');
    expect(txs[1].isSwap).toBe(true);
    expect(txs[2].coin).toBe('ETH');
    expect(txs[2].type).toBe('BUY');
  });
});

describe('Upbit parseText', () => {
  it('parses 매수 and 매도 rows, skipping 입금/출금', () => {
    const text = readFixture('upbit-sample.txt');
    const txs = parseUpbit(text);
    expect(txs).toHaveLength(2);

    const buy = txs[0];
    expect(buy.type).toBe('BUY');
    expect(buy.coin).toBe('USDT');
    expect(buy.amount).toBe(100);
    expect(buy.pricePerUnit).toBe(1500);
    expect(buy.total).toBe(150_000);
    expect(buy.fee).toBe(75);
    expect(buy.quoteCurrency).toBe('KRW');
    expect(buy.feeCurrency).toBe('KRW');
    expect(buy.exchange).toBe('Upbit');

    const sell = txs[1];
    expect(sell.type).toBe('SELL');
    expect(sell.coin).toBe('BTC');
    expect(sell.amount).toBe(0.005);
    expect(sell.pricePerUnit).toBe(95_000_000);
    expect(sell.total).toBe(475_000);
    expect(sell.fee).toBe(95);
  });

  it('parses date as KST', () => {
    const text = readFixture('upbit-sample.txt');
    const txs = parseUpbit(text);
    expect(txs[0].date.toISOString()).toBe('2027-04-13T15:19:00.000Z');
    expect(txs[1].date.toISOString()).toBe('2027-06-01T01:30:00.000Z');
  });

  it('returns empty array for empty input', () => {
    expect(parseUpbit('')).toEqual([]);
  });

  it('returns empty array for header-only text', () => {
    const text =
      '체결시간 \t코인 \t마켓 \t종류 \t거래수량 \t거래단가 \t거래금액 \t수수료 \t정산금액 \t주문시간';
    expect(parseUpbit(text)).toEqual([]);
  });
});

describe('Parser canParse', () => {
  it('binanceSpotParser matches CSV with Spot header', () => {
    expect(
      binanceSpotParser.canParse(
        'a.csv',
        'Time,Pair,Side,Price,Executed,Amount,Fee\n',
      ),
    ).toBe(true);
  });

  it('binanceSpotParser rejects non-CSV', () => {
    expect(binanceSpotParser.canParse('a.pdf', '')).toBe(false);
  });

  it('binanceSpotParser rejects Futures CSV', () => {
    expect(
      binanceSpotParser.canParse('a.csv', 'Uid,Time,Symbol,Realized Profit'),
    ).toBe(false);
  });

  it('binanceSpotParser rejects unknown CSV header', () => {
    expect(binanceSpotParser.canParse('a.csv', 'Foo,Bar,Baz')).toBe(false);
  });

  it('upbitParser matches .pdf', () => {
    expect(upbitParser.canParse('upbit.pdf', '')).toBe(true);
  });

  it('upbitParser rejects non-PDF', () => {
    expect(upbitParser.canParse('a.csv', '')).toBe(false);
  });
});

describe('looksLikeUpbitTransactionPdf (signature check)', () => {
  it('"업비트" 키워드 포함 → true', () => {
    expect(
      looksLikeUpbitTransactionPdf('업비트 거래내역 양도소득 기간 2024'),
    ).toBe(true);
  });

  it('영문 "Upbit" 포함 → true', () => {
    expect(looksLikeUpbitTransactionPdf('Upbit Transaction History')).toBe(true);
  });

  it('"체결시간" 컬럼 헤더만 있어도 → true', () => {
    expect(
      looksLikeUpbitTransactionPdf('체결시간 코인 마켓 종류 거래수량'),
    ).toBe(true);
  });

  it('"거래단가" 헤더 포함 → true', () => {
    expect(looksLikeUpbitTransactionPdf('일자 거래단가 거래금액')).toBe(true);
  });

  it('이용동의서·계약서 등 무관한 텍스트 → false', () => {
    expect(
      looksLikeUpbitTransactionPdf(
        '퀀트솔루션 이용동의서 본 동의서는 서비스 이용에 관한 약관입니다.',
      ),
    ).toBe(false);
  });

  it('영수증 무관 텍스트 → false', () => {
    expect(
      looksLikeUpbitTransactionPdf('카드 영수증 결제 일시 2024-07-05'),
    ).toBe(false);
  });

  it('빈 텍스트 → false', () => {
    expect(looksLikeUpbitTransactionPdf('')).toBe(false);
  });
});

describe('Registry', () => {
  it('isBinanceFutures detects via filename', () => {
    expect(
      isBinanceFutures('Binance-Futures-Trade-History.csv', ''),
    ).toBe(true);
    expect(isBinanceFutures('Binance-Spot-Trade-History.csv', '')).toBe(false);
  });

  it('isBinanceFutures detects via header sample', () => {
    expect(
      isBinanceFutures('foo.csv', 'Uid,Time,Symbol,Realized Profit,...'),
    ).toBe(true);
    expect(isBinanceFutures('foo.csv', 'Time,Pair,Side,Price')).toBe(false);
  });

  it('findParser routes CSV with Spot header to binanceSpotParser', () => {
    const sample = 'Time,Pair,Side,Price,Executed,Amount,Fee\n';
    expect(findParser('history.csv', sample)?.id).toBe('binance-spot');
  });

  it('findParser routes .pdf to upbitParser', () => {
    expect(findParser('upbit.pdf', '')?.id).toBe('upbit');
  });

  it('findParser returns undefined for unknown file', () => {
    expect(findParser('unknown.txt', '')).toBeUndefined();
  });

  it('parseFile parses Binance Spot CSV end-to-end', async () => {
    const csv = readFixture('binance-spot-sample.csv');
    const file = new File([csv], 'binance-spot.csv', { type: 'text/csv' });
    const txs = await parseFile(file);
    expect(txs).toHaveLength(3);
  });

  it('parseFile throws specific error for Binance Futures CSV', async () => {
    const csv = readFixture('binance-futures-sample.csv');
    const file = new File([csv], 'Binance-Futures-Trade-History.csv', {
      type: 'text/csv',
    });
    await expect(parseFile(file)).rejects.toThrow(/선물/);
  });

  it('parseFile throws clear error for unknown file type', async () => {
    const file = new File(['hello'], 'unknown.txt');
    await expect(parseFile(file)).rejects.toThrow(/지원하지 않는/);
  });

  // 바이낸스 Order History 친절 안내 — Trade History와 혼동하는 흔한 케이스.
  it('isBinanceOrderHistory detects via filename', () => {
    expect(
      isBinanceOrderHistory('Binance-Spot-Order-History-202605120058.csv', ''),
    ).toBe(true);
    expect(
      isBinanceOrderHistory('Binance-Spot-Trade-History.csv', ''),
    ).toBe(false);
  });

  it('isBinanceOrderHistory detects via header (OrderNo + Status)', () => {
    const header =
      'Time,OrderNo,Pair,Type¹,Side,Order Price,Order Amount,Time,Executed²,Average Price,Trading total³,Status';
    expect(isBinanceOrderHistory('foo.csv', header)).toBe(true);
    // Trade History 헤더에는 OrderNo도 Status도 없음
    expect(
      isBinanceOrderHistory('foo.csv', 'Time,Pair,Side,Price,Executed,Amount,Fee'),
    ).toBe(false);
  });

  it('parseFile throws guided error for Binance Order History CSV', async () => {
    const csv = `Time,OrderNo,Pair,Type¹,Side,Order Price,Order Amount,Time,Executed²,Average Price,Trading total³,Status
24-07-05 12:07:20,28325058974,BTCUSDT,Market,SELL,0,0.00093BTC,24-07-05 12:07:20,0.00093BTC,55607.31,51.7147983USDT,FILLED`;
    const file = new File([csv], 'Binance-Spot-Order-History-202605120058.csv', {
      type: 'text/csv',
    });
    // 메시지에 Trade History 안내가 포함돼야 함
    await expect(parseFile(file)).rejects.toThrow(/Trade History/);
  });
});
