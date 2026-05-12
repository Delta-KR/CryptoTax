export interface ParsedTransactionWire {
  id: string;
  date: string;
  type: 'BUY' | 'SELL';
  coin: string;
  amount: number;
  pricePerUnit: number;
  total: number;
  fee: number;
  exchange: string;
  quoteCurrency: string;
  feeCurrency: string;
  isSwap?: boolean;
}

export interface UnifiedTransactionWire {
  id: string;
  date: string;
  type: 'BUY' | 'SELL' | 'SWAP';
  coin: string;
  amount: number;
  pricePerUnitKRW: number;
  totalKRW: number;
  feeKRW: number;
  exchange: string;
  originalCurrency: string;
}

export interface RealizedGainWire {
  id: string;
  coin: string;
  sellDate: string;
  sellAmount: number;
  proceedsKRW: number;
  costBasisKRW: number;
  sellFeeKRW: number;
  buyFeeKRW: number;
  pnlKRW: number;
  exchange: string;
  consumedLots: Array<{
    lotId: string;
    amount: number;
    pricePerUnitKRW: number;
    costKRW: number;
  }>;
}

export interface LotWire {
  id: string;
  coin: string;
  amount: number;
  originalAmount: number;
  pricePerUnitKRW: number;
  totalCostKRW: number;
  feeKRW: number;
  date: string;
  exchange: string;
  isDeemedCost: boolean;
}

export interface CoinSummaryWire {
  coin: string;
  totalBuyKRW: number;
  totalSellKRW: number;
  realizedPnLKRW: number;
  totalFeeKRW: number;
  transactionCount: number;
}

export interface TaxResultWire {
  year: number;
  totalGainKRW: number;
  totalLossKRW: number;
  netPnLKRW: number;
  deductionKRW: number;
  taxableIncomeKRW: number;
  taxAmountKRW: number;
  incomeTaxKRW: number;
  localTaxKRW: number;
  realizedGains: RealizedGainWire[];
  holdingsAfter: Record<string, LotWire[]>;
  summary: CoinSummaryWire[];
  warnings: string[];
  plan: 'free' | 'premium';
  masked: boolean;
}

export interface CalculatePayload {
  newParsed: ParsedTransactionWire[];
  allParsed: ParsedTransactionWire[];
  allUnified: UnifiedTransactionWire[];
  result: TaxResultWire;
  year: number;
}

export interface CalculateSuccess {
  ok: true;
  payload: CalculatePayload;
}

export interface CalculateFailure {
  ok: false;
  error: string;
  errorType: 'parse' | 'unsupported' | 'unknown';
}

export type CalculateResult = CalculateSuccess | CalculateFailure;
