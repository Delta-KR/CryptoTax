export type TxType = 'BUY' | 'SELL' | 'SWAP';

export type Currency = string;

export const FIAT_LIKE_QUOTES: readonly string[] = [
  'KRW',
  'USDT',
  'USDC',
  'BUSD',
  'FDUSD',
  'USD',
  'EUR',
  'TRY',
];

export interface ParsedTransaction {
  id: string;
  date: Date;
  type: 'BUY' | 'SELL';
  coin: string;
  amount: number;
  pricePerUnit: number;
  total: number;
  fee: number;
  exchange: string;
  quoteCurrency: Currency;
  feeCurrency: Currency;
  isSwap?: boolean;
}

// P1 #8: 거래별 환율 출처 audit trail.
// quoteCurrency → KRW 변환에 사용된 환율 + 데이터 출처. quoteCurrency=KRW면 undefined.
export interface RateMeta {
  rateKRW: number;
  sourceDate: string; // YYYY-MM-DD (KST) — 실제 데이터 기준일 (거래일과 다를 수 있음)
  source: 'db' | 'static';
  sourceName: string; // 'Upbit', 'Static fallback' 등
}

export interface UnifiedTransaction {
  id: string;
  date: Date;
  type: TxType;
  coin: string;
  amount: number;
  pricePerUnitKRW: number;
  totalKRW: number;
  feeKRW: number;
  exchange: string;
  originalCurrency: Currency;
  rateMeta?: RateMeta;
  swapToCoin?: string;
  swapToAmount?: number;
}

export interface Lot {
  id: string;
  coin: string;
  amount: number;
  originalAmount: number;
  pricePerUnitKRW: number;
  totalCostKRW: number;
  feeKRW: number;
  date: Date;
  exchange: string;
  isDeemedCost: boolean;
}

export interface ConsumedLot {
  lotId: string;
  amount: number;
  pricePerUnitKRW: number;
  costKRW: number;
  // FIFO: 항상 채움. MA: avg entry라 undefined (혼합 매수의 의미가 없으므로).
  buyDate?: Date;
  exchange?: string;
  // FIFO: lot 그대로. MA: underlying lots 중 하나라도 의제면 true (OR).
  isDeemedCost: boolean;
}

export interface RealizedGain {
  id: string;
  coin: string;
  sellDate: Date;
  sellAmount: number;
  proceedsKRW: number;
  costBasisKRW: number;
  sellFeeKRW: number;
  buyFeeKRW: number;
  pnlKRW: number;
  exchange: string;
  consumedLots: ConsumedLot[];
}

export interface CoinSummary {
  coin: string;
  totalBuyKRW: number;
  totalSellKRW: number;
  realizedPnLKRW: number;
  totalFeeKRW: number;
  transactionCount: number;
}

// P1 #9: 거래소 × 코인 매트릭스. 세무사 전달 시 거래소별 정리에 유용.
// realizedPnLKRW는 매도가 일어난 거래소 기준 (`RealizedGain.exchange`).
export interface ExchangeCoinSummary {
  exchange: string;
  coin: string;
  totalBuyKRW: number;
  totalSellKRW: number;
  realizedPnLKRW: number;
  totalFeeKRW: number;
  transactionCount: number;
}

export interface TaxResult {
  year: number;
  totalGainKRW: number;
  totalLossKRW: number;
  netPnLKRW: number;
  deductionKRW: number;
  taxableIncomeKRW: number;
  taxAmountKRW: number;
  incomeTaxKRW: number;
  localTaxKRW: number;
  realizedGains: RealizedGain[];
  holdingsAfter: Record<string, Lot[]>;
  summary: CoinSummary[];
  summaryByExchange: ExchangeCoinSummary[];
  warnings: string[];
}

export interface ExchangeRate {
  date: string;
  usdToKrw: number;
  usdtToKrw: number;
}
