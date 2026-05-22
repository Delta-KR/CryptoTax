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

// P1 #8: 거래별 환율 출처 audit trail. quoteCurrency=KRW면 undefined.
export interface RateMetaWire {
  rateKRW: number;
  sourceDate: string; // YYYY-MM-DD (KST)
  source: 'db' | 'static';
  sourceName: string;
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
  rateMeta?: RateMetaWire;
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
    // FIFO에서만 채워짐. MA의 avg entry는 undefined.
    buyDate?: string;
    exchange?: string;
    isDeemedCost: boolean;
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

// P1 #9: 거래소 × 코인 매트릭스.
export interface ExchangeCoinSummaryWire {
  exchange: string;
  coin: string;
  totalBuyKRW: number;
  totalSellKRW: number;
  realizedPnLKRW: number;
  totalFeeKRW: number;
  transactionCount: number;
}

export interface RateSourceInfoWire {
  primary: string; // DB 적재 출처 (예: 'Upbit (KRW market daily close)')
  fallbackUsed: boolean; // 정적 fallback이 한 건이라도 사용됐는지
  lastFetchedAt: string | null; // ISO timestamp
  fallbackName: string;
}

// 의제취득가액 시가 source 분포 (DB 조회 결과 요약).
export interface DeemedCostSourceWire {
  realCoins: string[]; // 2026-12-31 실측 (source_type='real')
  estimateCoins: string[]; // 추정치 (source_type='estimate')
  userOverrideCoins: string[]; // 사용자 수동 입력 (source_type='user_override')
  missingCoins: string[]; // pre-2027 매수 있는데 시가 DB에 없음 → 의제 미적용 (실가 사용)
  deemedDate: string; // 'YYYY-MM-DD' — 기본 '2026-12-31'
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
  summaryByExchange: ExchangeCoinSummaryWire[];
  warnings: string[];
  plan: 'free' | 'premium';
  masked: boolean;
  rateSource?: RateSourceInfoWire;
  deemedCostSource?: DeemedCostSourceWire;
}

export type TaxMethodWire = 'totalAverage' | 'fifo' | 'avg';

export interface CalculatePayload {
  newParsed: ParsedTransactionWire[];
  allParsed: ParsedTransactionWire[];
  allUnified: UnifiedTransactionWire[];
  result: TaxResultWire;
  year: number;
  method: TaxMethodWire;
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
