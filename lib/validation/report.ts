import { z } from 'zod';

// 한국 양도소득 신고 데이터의 합리적 상한. NaN/Infinity 차단 + 메모리·CPU 폭주 방어.
// 모든 monetary 값은 KRW; ±1e15는 1,000조 — 어떤 실제 거래도 넘을 수 없음.
const moneyKRW = z.number().finite().min(-1e15).max(1e15);

// 코인 티커: 영문 대소문자·숫자·`_`·`-`만. 1~16자.
// 1000FLOKI 같은 prefix 숫자도 허용.
const coinName = z.string().min(1).max(16).regex(/^[A-Za-z0-9_-]+$/);

const exchangeName = z.string().min(1).max(32);

// Wire 포맷의 date는 ISO 8601 문자열.
const isoDate = z.string().datetime({ offset: true });

const lotSchema = z.object({
  id: z.string().min(1).max(64),
  coin: coinName,
  amount: z.number().finite().min(0),
  originalAmount: z.number().finite().min(0),
  pricePerUnitKRW: moneyKRW,
  totalCostKRW: moneyKRW,
  feeKRW: moneyKRW,
  date: isoDate,
  exchange: exchangeName,
  isDeemedCost: z.boolean(),
});

const consumedLotSchema = z.object({
  lotId: z.string().min(1).max(64),
  amount: z.number().finite().min(0),
  pricePerUnitKRW: moneyKRW,
  costKRW: moneyKRW,
});

const realizedGainSchema = z.object({
  id: z.string().min(1).max(64),
  coin: coinName,
  sellDate: isoDate,
  sellAmount: z.number().finite().min(0),
  proceedsKRW: moneyKRW,
  costBasisKRW: moneyKRW,
  sellFeeKRW: moneyKRW,
  buyFeeKRW: moneyKRW,
  pnlKRW: moneyKRW,
  exchange: exchangeName,
  consumedLots: z.array(consumedLotSchema).max(1_000),
});

const coinSummarySchema = z.object({
  coin: coinName,
  totalBuyKRW: moneyKRW,
  totalSellKRW: moneyKRW,
  realizedPnLKRW: moneyKRW,
  totalFeeKRW: moneyKRW,
  transactionCount: z.number().int().min(0).max(100_000),
});

const taxResultSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  totalGainKRW: moneyKRW,
  totalLossKRW: moneyKRW,
  netPnLKRW: moneyKRW,
  deductionKRW: moneyKRW,
  taxableIncomeKRW: moneyKRW,
  taxAmountKRW: moneyKRW,
  incomeTaxKRW: moneyKRW,
  localTaxKRW: moneyKRW,
  realizedGains: z.array(realizedGainSchema).max(10_000),
  // holdingsAfter: 최대 500개 코인 × 코인당 2,000 lots
  holdingsAfter: z
    .record(coinName, z.array(lotSchema).max(2_000))
    .refine((rec) => Object.keys(rec).length <= 500, {
      message: 'holdingsAfter exceeds 500 keys',
    }),
  summary: z.array(coinSummarySchema).max(500),
  warnings: z.array(z.string().max(500)).max(50),
  plan: z.enum(['free', 'premium']),
  masked: z.boolean(),
});

const unifiedTransactionSchema = z.object({
  id: z.string().min(1).max(64),
  date: isoDate,
  type: z.enum(['BUY', 'SELL', 'SWAP']),
  coin: coinName,
  amount: z.number().finite(),
  pricePerUnitKRW: moneyKRW,
  totalKRW: moneyKRW,
  feeKRW: moneyKRW,
  exchange: exchangeName,
  originalCurrency: z.string().min(1).max(16),
});

export const reportRequestSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  result: taxResultSchema,
  transactions: z.array(unifiedTransactionSchema).max(10_000),
});

export type ReportRequest = z.infer<typeof reportRequestSchema>;
