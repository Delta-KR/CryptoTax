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

// v2 백로그 #1: FIFO vs MA 자동 비교 카드용. 양쪽 method 모두 계산해서 wire에 함께 전달.
// 메인 결과(TaxResultWire 최상위 필드들)는 사용자가 선택한 method 결과. 비교 카드는 alternative
// method의 핵심 지표만 노출 (전체 데이터는 main 결과로 표시되므로 중복 제거).
// free plan에서는 masked: true일 때 두 값 모두 0으로 노출 (premium 전용).
export interface ComparisonResultWire {
  netPnLKRW: number;
  taxableIncomeKRW: number;
  taxAmountKRW: number;
}

export interface MethodComparisonWire {
  fifo: ComparisonResultWire;
  ma: ComparisonResultWire;
  // selectedMethod와 alternative의 세금 차이 (alt - selected). 음수면 alt가 유리.
  // 클라이언트가 직접 계산해도 되지만 wire에 미리 담아두면 UI가 단순해짐.
  selected: 'fifo' | 'ma';
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
  // v2 백로그 #1: 마케팅 약속 충족. method 토글 없이도 두 방식 결과를 비교 카드로 노출.
  methodComparison?: MethodComparisonWire;
}

export type TaxMethodWire = 'fifo' | 'avg';

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
