import type { ConsumedLot, Lot } from './types';

export interface ConsumeResult {
  costBasisKRW: number;
  consumedLots: ConsumedLot[];
  buyFeeKRW: number;
}

// 양도소득세 계산용 lot 관리 엔진. 거주자 디폴트는 총평균법(시행령 §88①·§92②4호) —
// 별도 경로(lib/engine/total-average.ts)에서 lot 추적 없이 연 평균 단가로 산출.
// FIFO·이동평균은 비거주자 모드(§183⑥) 또는 참고용 시나리오로만 사용되며,
// 이 인터페이스를 implements한 클래스로 만들고 tax-calculator에서 dispatch.
export interface TaxEngine {
  addLot(coin: string, lot: Lot): void;
  // 매도 시점에 코인 보유량에서 sellAmount만큼 차감, 차감된 cost basis 반환.
  // 보유량 부족 시 throw — orphan SELL 처리는 caller 책임.
  consumeLots(coin: string, sellAmount: number): ConsumeResult;
  getHoldings(): Map<string, Lot[]>;
  getLotsByCoin(coin: string): Lot[];
}
