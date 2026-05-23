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
  buyDate: isoDate.optional(),
  exchange: exchangeName.optional(),
  isDeemedCost: z.boolean(),
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

const exchangeCoinSummarySchema = z.object({
  exchange: exchangeName,
  coin: coinName,
  totalBuyKRW: moneyKRW,
  totalSellKRW: moneyKRW,
  realizedPnLKRW: moneyKRW,
  totalFeeKRW: moneyKRW,
  transactionCount: z.number().int().min(0).max(100_000),
});

const rateSourceSchema = z
  .object({
    primary: z.string().max(128),
    fallbackUsed: z.boolean(),
    lastFetchedAt: z.string().max(64).nullable(),
    fallbackName: z.string().max(256),
  })
  .optional();

const deemedCostSourceSchema = z
  .object({
    realCoins: z.array(coinName).max(500),
    estimateCoins: z.array(coinName).max(500),
    userOverrideCoins: z.array(coinName).max(500),
    missingCoins: z.array(coinName).max(500),
    deemedDate: z.string().max(16),
  })
  .optional();

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
  // 거래소 × 코인 매트릭스 — 거래소 20개 × 코인 500개 상한.
  // 구버전 세션 호환: 누락 시 빈 배열 default.
  summaryByExchange: z
    .array(exchangeCoinSummarySchema)
    .max(10_000)
    .default([]),
  warnings: z.array(z.string().max(500)).max(50),
  plan: z.enum(['free', 'premium']),
  masked: z.boolean(),
  rateSource: rateSourceSchema,
  deemedCostSource: deemedCostSourceSchema,
});

const rateMetaSchema = z
  .object({
    rateKRW: z.number().finite().min(0).max(1e9),
    sourceDate: z.string().max(16),
    source: z.enum(['db', 'static']),
    sourceName: z.string().min(1).max(128),
  })
  .optional();

// P0-4 hardening: 클라이언트가 unified.totalKRW 만 0 으로 바꿔 ₩0 세액 PDF 를 만드는
// 공격을 차단. normalize() 는 totalKRW = round(amount * rate) 로 정확히 일치시키므로
// 0.5% 면 라운딩·rate source 사소한 흔들림 흡수에 충분하고, 그 이상은 위변조로 본다.
// (5% 면 공격자가 신고 세액을 5% 깎을 수 있어 의미 없음.)
const UNIFIED_TX_RELATIVE_TOLERANCE = 0.005;

const unifiedTransactionSchema = z
  .object({
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
    rateMeta: rateMetaSchema,
  })
  .refine(
    (tx) => {
      if (tx.amount === 0) {
        return tx.totalKRW === 0 && tx.pricePerUnitKRW === 0;
      }
      const expected = tx.amount * tx.pricePerUnitKRW;
      const diff = Math.abs(tx.totalKRW - expected);
      const denom = Math.max(Math.abs(tx.totalKRW), Math.abs(expected), 1);
      return diff / denom < UNIFIED_TX_RELATIVE_TOLERANCE;
    },
    {
      message:
        'totalKRW = amount × pricePerUnitKRW 불일치 — 거래 데이터가 손상됐거나 위변조됐을 수 있습니다.',
    },
  );

export const reportRequestSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  result: taxResultSchema,
  transactions: z.array(unifiedTransactionSchema).max(10_000),
  // 구버전 세션 호환: method 누락 시 'totalAverage' 디폴트 (route.ts에서 보강).
  // 시행령 §88① 거주자 총평균법.
  method: z.enum(['totalAverage', 'fifo', 'avg']).optional(),
});

export type ReportRequest = z.infer<typeof reportRequestSchema>;
