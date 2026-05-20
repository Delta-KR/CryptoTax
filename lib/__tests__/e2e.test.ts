import { describe, it, expect } from 'vitest';
import { normalize } from '@/lib/engine/normalizer';
import { calculateTax } from '@/lib/engine/tax-calculator';
import { StaticExchangeRateProvider } from '@/lib/engine/exchange-rate';
import type { ParsedTransaction } from '@/lib/engine/types';
import { parseText as parseBinanceSpot } from '@/lib/parsers/binance-spot.parser';

let counter = 0;
const nextId = () => `tx-${++counter}`;

function ptx(p: Partial<ParsedTransaction>): ParsedTransaction {
  return {
    id: nextId(),
    date: new Date('2027-06-01T00:00:00+09:00'),
    type: 'BUY',
    coin: 'BTC',
    amount: 1,
    pricePerUnit: 50_000_000,
    total: 50_000_000,
    fee: 0,
    exchange: 'TEST',
    quoteCurrency: 'KRW',
    feeCurrency: 'KRW',
    ...p,
  };
}

describe('E2E Scenario A — Single exchange (Upbit, KRW market)', () => {
  it('BUY then SELL USDT with profit; deduction applied; 22% tax', async () => {
    const parsed: ParsedTransaction[] = [
      ptx({
        date: new Date('2027-03-01T10:00:00+09:00'),
        type: 'BUY',
        coin: 'USDT',
        amount: 10_000,
        pricePerUnit: 1400,
        total: 14_000_000,
        fee: 7_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-09-01T14:00:00+09:00'),
        type: 'SELL',
        coin: 'USDT',
        amount: 10_000,
        pricePerUnit: 1700,
        total: 17_000_000,
        fee: 8_500,
        exchange: 'Upbit',
      }),
    ];

    const rates = new StaticExchangeRateProvider([]);
    const unified = await normalize(parsed, rates);
    expect(unified).toHaveLength(2);

    const result = calculateTax({ transactions: unified, year: 2027 });

    // hand calc:
    //   cost basis  = 14,000,000
    //   proceeds    = 17,000,000
    //   sell fee    =      8,500
    //   buy fee     =      7,000  (full lot consumed → full fee)
    //   PnL         = 17,000,000 - 14,000,000 - 8,500 - 7,000 = 2,984,500
    //   taxable     = 2,984,500 - 2,500,000 = 484,500
    //   income tax  = 484,500 × 0.20 = 96,900
    //   local tax   = 484,500 × 0.02 = 9,690
    //   total tax   = 106,590
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].costBasisKRW).toBe(14_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(2_984_500);
    expect(result.totalGainKRW).toBe(2_984_500);
    expect(result.netPnLKRW).toBe(2_984_500);
    expect(result.taxableIncomeKRW).toBe(484_500);
    expect(result.incomeTaxKRW).toBe(96_900);
    expect(result.localTaxKRW).toBe(9_690);
    expect(result.taxAmountKRW).toBe(106_590);
  });
});

describe('E2E Scenario B — Multi-exchange (Upbit + Binance, KRW + USDT)', () => {
  it('processes BTC on Binance (USDT) and USDT on Upbit (KRW)', async () => {
    const parsed: ParsedTransaction[] = [
      ptx({
        date: new Date('2027-01-01T09:00:00+09:00'),
        type: 'BUY',
        coin: 'USDT',
        amount: 5_000,
        pricePerUnit: 1400,
        total: 7_000_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-03-01T10:00:00+09:00'),
        type: 'BUY',
        coin: 'BTC',
        amount: 0.2,
        pricePerUnit: 50_000,
        total: 10_000,
        exchange: 'Binance',
        quoteCurrency: 'USDT',
        feeCurrency: 'USDT',
      }),
      ptx({
        date: new Date('2027-06-01T15:00:00+09:00'),
        type: 'SELL',
        coin: 'BTC',
        amount: 0.2,
        pricePerUnit: 60_000,
        total: 12_000,
        exchange: 'Binance',
        quoteCurrency: 'USDT',
        feeCurrency: 'USDT',
      }),
      ptx({
        date: new Date('2027-09-01T11:00:00+09:00'),
        type: 'SELL',
        coin: 'USDT',
        amount: 5_000,
        pricePerUnit: 1600,
        total: 8_000_000,
        exchange: 'Upbit',
      }),
    ];

    const rates = new StaticExchangeRateProvider([
      ['2027-03-01', 'USDT', 'KRW', 1400],
      ['2027-06-01', 'USDT', 'KRW', 1500],
    ]);

    const unified = await normalize(parsed, rates);
    const result = calculateTax({ transactions: unified, year: 2027 });

    // hand calc:
    //   BTC:  cost = 0.2 × 50,000 × 1,400 = 14,000,000
    //         sale = 0.2 × 60,000 × 1,500 = 18,000,000  → PnL = 4,000,000
    //   USDT: cost = 5,000 × 1,400 = 7,000,000
    //         sale = 5,000 × 1,600 = 8,000,000  → PnL = 1,000,000
    //   total PnL = 5,000,000
    //   taxable   = 5,000,000 - 2,500,000 = 2,500,000
    //   tax       = 2,500,000 × 0.22 = 550,000
    expect(result.totalGainKRW).toBe(5_000_000);
    expect(result.netPnLKRW).toBe(5_000_000);
    expect(result.taxableIncomeKRW).toBe(2_500_000);
    expect(result.taxAmountKRW).toBe(550_000);
    expect(result.summary.map((s) => s.coin).sort()).toEqual(['BTC', 'USDT']);
  });
});

describe('E2E Scenario C — Coin-coin SWAP (Binance ETHBTC)', () => {
  it('splits SWAP into SELL base + BUY quote, tracks both PnLs', async () => {
    const parsed: ParsedTransaction[] = [
      ptx({
        date: new Date('2027-01-01T09:00:00+09:00'),
        type: 'BUY',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 50_000,
        total: 50_000,
        exchange: 'Binance',
        quoteCurrency: 'USDT',
        feeCurrency: 'USDT',
      }),
      // SWAP: pay 0.05 BTC to acquire 1 ETH
      ptx({
        date: new Date('2027-06-01T15:00:00+09:00'),
        type: 'BUY',
        coin: 'ETH',
        amount: 1,
        pricePerUnit: 0.05,
        total: 0.05,
        fee: 0.001,
        exchange: 'Binance',
        quoteCurrency: 'BTC',
        feeCurrency: 'BTC',
        isSwap: true,
      }),
      ptx({
        date: new Date('2027-09-01T11:00:00+09:00'),
        type: 'SELL',
        coin: 'ETH',
        amount: 1,
        pricePerUnit: 8_000_000,
        total: 8_000_000,
        exchange: 'Upbit',
      }),
    ];

    const rates = new StaticExchangeRateProvider([
      ['2027-01-01', 'USDT', 'KRW', 1400],
      ['2027-06-01', 'BTC', 'KRW', 80_000_000],
    ]);

    const unified = await normalize(parsed, rates);
    // 4 unified txs: BUY BTC, SELL BTC (from swap), BUY ETH (from swap), SELL ETH
    expect(unified).toHaveLength(4);

    const result = calculateTax({ transactions: unified, year: 2027 });

    // hand calc:
    //   BTC: bought 1 BTC at 50,000 × 1,400 = 70,000,000 cost
    //        swap-out 0.05 BTC for 4,000,000 (0.05 × 80M); cost basis = 0.05 × 70M = 3,500,000
    //        sell fee = 0.001 × 80,000,000 = 80,000
    //        PnL = 4,000,000 - 3,500,000 - 80,000 = 420,000
    //   ETH: acquired via swap at cost 4,000,000 KRW (0.05 × 80M); fee 0 on BUY side
    //        sold for 8,000,000
    //        PnL = 8,000,000 - 4,000,000 = 4,000,000
    //   total PnL = 4,420,000
    //   taxable   = 4,420,000 - 2,500,000 = 1,920,000
    //   tax       = 1,920,000 × 0.22 = 422,400
    expect(result.realizedGains).toHaveLength(2);
    expect(result.totalGainKRW).toBe(4_420_000);
    expect(result.taxableIncomeKRW).toBe(1_920_000);
    expect(result.taxAmountKRW).toBe(422_400);
  });
});

describe('E2E Scenario D — Deemed cost (2026 buy + 2027 sell)', () => {
  it('uses snapshot price when actual cost is lower', async () => {
    const parsed: ParsedTransaction[] = [
      ptx({
        date: new Date('2026-06-01T10:00:00+09:00'),
        type: 'BUY',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 50_000_000,
        total: 50_000_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-06-01T10:00:00+09:00'),
        type: 'SELL',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 90_000_000,
        total: 90_000_000,
        exchange: 'Upbit',
      }),
    ];

    const rates = new StaticExchangeRateProvider([]);
    const unified = await normalize(parsed, rates);
    const result = calculateTax({
      transactions: unified,
      year: 2027,
      deemedCostPrices: new Map([['BTC', 70_000_000]]),
    });

    // hand calc:
    //   actual cost     = 50,000,000
    //   snapshot price  = 70,000,000   (2026-12-31 시가)
    //   cost basis used = max(actual, snapshot) = 70,000,000
    //   PnL             = 90,000,000 - 70,000,000 = 20,000,000
    //   taxable         = 20,000,000 - 2,500,000 = 17,500,000
    //   tax             = 17,500,000 × 0.22 = 3,850,000
    expect(result.realizedGains[0].costBasisKRW).toBe(70_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(20_000_000);
    expect(result.taxableIncomeKRW).toBe(17_500_000);
    expect(result.taxAmountKRW).toBe(3_850_000);
  });

  it('uses actual cost when actual exceeds snapshot', async () => {
    const parsed: ParsedTransaction[] = [
      ptx({
        date: new Date('2026-06-01T10:00:00+09:00'),
        type: 'BUY',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 80_000_000,
        total: 80_000_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-06-01T10:00:00+09:00'),
        type: 'SELL',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 90_000_000,
        total: 90_000_000,
        exchange: 'Upbit',
      }),
    ];

    const rates = new StaticExchangeRateProvider([]);
    const unified = await normalize(parsed, rates);
    const result = calculateTax({
      transactions: unified,
      year: 2027,
      deemedCostPrices: new Map([['BTC', 70_000_000]]),
    });

    expect(result.realizedGains[0].costBasisKRW).toBe(80_000_000);
    expect(result.realizedGains[0].pnlKRW).toBe(10_000_000);
  });
});

describe('E2E Scenario E — Method comparison (FIFO vs MA): 같은 거래, 다른 결과', () => {
  it('다른 가격 매수×2 → 부분 매도: FIFO와 MA가 다른 cost basis', async () => {
    const parsed: ParsedTransaction[] = [
      ptx({
        date: new Date('2027-01-01T09:00:00+09:00'),
        type: 'BUY',
        coin: 'BTC',
        amount: 0.1,
        pricePerUnit: 50_000_000,
        total: 5_000_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-02-01T10:00:00+09:00'),
        type: 'BUY',
        coin: 'BTC',
        amount: 0.1,
        pricePerUnit: 70_000_000,
        total: 7_000_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-06-01T15:00:00+09:00'),
        type: 'SELL',
        coin: 'BTC',
        amount: 0.1,
        pricePerUnit: 60_000_000,
        total: 6_000_000,
        exchange: 'Upbit',
      }),
    ];

    const rates = new StaticExchangeRateProvider([]);
    const unified = await normalize(parsed, rates);

    const fifoResult = calculateTax({
      transactions: unified,
      year: 2027,
      method: 'fifo',
    });
    // FIFO: 첫 매수 lot (50M) 소비 → cost = 5M, proceeds = 6M, PnL = 1M
    expect(fifoResult.realizedGains[0].costBasisKRW).toBe(5_000_000);
    expect(fifoResult.realizedGains[0].pnlKRW).toBe(1_000_000);

    const avgResult = calculateTax({
      transactions: unified,
      year: 2027,
      method: 'avg',
    });
    // MA: avg = (5M + 7M)/0.2 = 60M, cost = 6M, proceeds = 6M, PnL = 0
    expect(avgResult.realizedGains[0].costBasisKRW).toBe(6_000_000);
    expect(avgResult.realizedGains[0].pnlKRW).toBe(0);
  });

  it('의제취득가액 + MA: pre-2027 + post-2027 매수 혼합 후 매도', async () => {
    const parsed: ParsedTransaction[] = [
      ptx({
        date: new Date('2026-06-01T10:00:00+09:00'),
        type: 'BUY',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 50_000_000,
        total: 50_000_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-03-01T10:00:00+09:00'),
        type: 'BUY',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 80_000_000,
        total: 80_000_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-06-01T10:00:00+09:00'),
        type: 'SELL',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 100_000_000,
        total: 100_000_000,
        exchange: 'Upbit',
      }),
    ];

    const rates = new StaticExchangeRateProvider([]);
    const unified = await normalize(parsed, rates);
    const deemed = new Map([['BTC', 70_000_000]]);

    const fifoResult = calculateTax({
      transactions: unified,
      year: 2027,
      method: 'fifo',
      deemedCostPrices: deemed,
    });
    // FIFO: 첫 lot = max(50M, 70M) = 70M cost, PnL = 30M
    expect(fifoResult.realizedGains[0].costBasisKRW).toBe(70_000_000);
    expect(fifoResult.realizedGains[0].pnlKRW).toBe(30_000_000);

    const avgResult = calculateTax({
      transactions: unified,
      year: 2027,
      method: 'avg',
      deemedCostPrices: deemed,
    });
    // MA: 의제 후 avg = (70M + 80M)/2 = 75M, cost = 75M, PnL = 25M
    expect(avgResult.realizedGains[0].costBasisKRW).toBe(75_000_000);
    expect(avgResult.realizedGains[0].pnlKRW).toBe(25_000_000);
  });
});

describe('E2E Scenario F — Audit trail (P1 #6/#7): consumedLots에 buyDate/exchange/의제 흐름', () => {
  it('FIFO: 다중 매수 → 부분 매도 시 각 lot의 매수일·거래소·의제 플래그가 노출', async () => {
    const parsed: ParsedTransaction[] = [
      ptx({
        date: new Date('2026-08-15T10:00:00+09:00'), // pre-deemed → 의제 적용
        type: 'BUY',
        coin: 'BTC',
        amount: 0.5,
        pricePerUnit: 40_000_000,
        total: 20_000_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-03-01T10:00:00+09:00'), // post-deemed → 실가
        type: 'BUY',
        coin: 'BTC',
        amount: 0.5,
        pricePerUnit: 90_000_000,
        total: 45_000_000,
        exchange: 'Binance',
      }),
      ptx({
        date: new Date('2027-09-01T10:00:00+09:00'),
        type: 'SELL',
        coin: 'BTC',
        amount: 0.7, // 첫 lot 0.5 + 두 번째 lot 0.2 소비
        pricePerUnit: 100_000_000,
        total: 70_000_000,
        exchange: 'Upbit',
      }),
    ];
    const rates = new StaticExchangeRateProvider([]);
    const unified = await normalize(parsed, rates);
    const result = calculateTax({
      transactions: unified,
      year: 2027,
      method: 'fifo',
      deemedCostPrices: new Map([['BTC', 70_000_000]]),
    });

    expect(result.realizedGains).toHaveLength(1);
    const lots = result.realizedGains[0].consumedLots;
    expect(lots).toHaveLength(2);

    // 첫 lot: pre-2027 Upbit 매수 → 의제 적용 (40M < 70M 시가)
    expect(lots[0].exchange).toBe('Upbit');
    expect(lots[0].buyDate).toBeDefined();
    expect(lots[0].buyDate?.getUTCFullYear()).toBe(2026);
    expect(lots[0].isDeemedCost).toBe(true);
    expect(lots[0].pricePerUnitKRW).toBe(70_000_000); // 의제 시가 적용

    // 두 번째 lot: 2027 Binance 매수 → 실가
    expect(lots[1].exchange).toBe('Binance');
    expect(lots[1].buyDate?.getUTCFullYear()).toBe(2027);
    expect(lots[1].isDeemedCost).toBe(false);
    expect(lots[1].pricePerUnitKRW).toBe(90_000_000);
  });

  it('MA: avg entry는 buyDate/exchange 없음, 의제 플래그는 underlying OR', async () => {
    const parsed: ParsedTransaction[] = [
      ptx({
        date: new Date('2026-08-15T10:00:00+09:00'), // 의제 적용
        type: 'BUY',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 40_000_000,
        total: 40_000_000,
        exchange: 'Upbit',
      }),
      ptx({
        date: new Date('2027-03-01T10:00:00+09:00'),
        type: 'BUY',
        coin: 'BTC',
        amount: 1,
        pricePerUnit: 90_000_000,
        total: 90_000_000,
        exchange: 'Binance',
      }),
      ptx({
        date: new Date('2027-09-01T10:00:00+09:00'),
        type: 'SELL',
        coin: 'BTC',
        amount: 0.5,
        pricePerUnit: 100_000_000,
        total: 50_000_000,
        exchange: 'Upbit',
      }),
    ];
    const rates = new StaticExchangeRateProvider([]);
    const unified = await normalize(parsed, rates);
    const result = calculateTax({
      transactions: unified,
      year: 2027,
      method: 'avg',
      deemedCostPrices: new Map([['BTC', 70_000_000]]),
    });

    expect(result.realizedGains).toHaveLength(1);
    const lots = result.realizedGains[0].consumedLots;
    expect(lots).toHaveLength(1);
    expect(lots[0].lotId).toBe('avg:BTC');
    // MA는 혼합 평균이라 buyDate/exchange는 의미 없음 → undefined
    expect(lots[0].buyDate).toBeUndefined();
    expect(lots[0].exchange).toBeUndefined();
    // underlying lots 중 하나라도 의제이므로 true
    expect(lots[0].isDeemedCost).toBe(true);
  });
});

describe('E2E Full pipeline — Binance CSV → ParsedTransaction → UnifiedTransaction → TaxResult', () => {
  it('processes Binance BTCUSDT BUY + SELL through full pipeline', async () => {
    const csv = `Time,Pair,Side,Price,Executed,Amount,Fee
27-01-01 09:00:00,BTCUSDT,BUY,50000,0.5BTC,25000USDT,12.5USDT
27-06-01 15:00:00,BTCUSDT,SELL,60000,0.5BTC,30000USDT,15USDT`;

    const parsed = parseBinanceSpot(csv);
    expect(parsed).toHaveLength(2);

    const rates = new StaticExchangeRateProvider([
      ['2027-01-01', 'USDT', 'KRW', 1400],
      ['2027-06-01', 'USDT', 'KRW', 1500],
    ]);

    const unified = await normalize(parsed, rates);
    const result = calculateTax({ transactions: unified, year: 2027 });

    // hand calc:
    //   BUY  : cost = 25,000 × 1,400 = 35,000,000 KRW
    //          fee  = 12.5 × 1,400  = 17,500 KRW
    //   SELL : proc = 30,000 × 1,500 = 45,000,000 KRW
    //          fee  = 15 × 1,500    = 22,500 KRW
    //   PnL  = 45,000,000 - 35,000,000 - 22,500 - 17,500 = 9,960,000
    //   taxable = 9,960,000 - 2,500,000 = 7,460,000
    //   tax     = 7,460,000 × 0.22 = 1,641,200
    expect(result.realizedGains).toHaveLength(1);
    expect(result.realizedGains[0].costBasisKRW).toBe(35_000_000);
    expect(result.realizedGains[0].sellFeeKRW).toBe(22_500);
    expect(result.realizedGains[0].buyFeeKRW).toBe(17_500);
    expect(result.realizedGains[0].pnlKRW).toBe(9_960_000);
    expect(result.taxableIncomeKRW).toBe(7_460_000);
    expect(result.taxAmountKRW).toBe(1_641_200);
  });
});
