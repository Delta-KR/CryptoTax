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
}

export interface ExchangeRate {
  date: string;
  usdToKrw: number;
  usdtToKrw: number;
}
