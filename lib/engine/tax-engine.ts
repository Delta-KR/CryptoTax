import type { ConsumedLot, Lot } from './types';

export interface ConsumeResult {
  costBasisKRW: number;
  consumedLots: ConsumedLot[];
  buyFeeKRW: number;
}

// 양도소득세 계산용 lot 관리 엔진. FIFO/이동평균법 등 방식별 구현은
// 이 인터페이스를 implements한 클래스로 만들고 tax-calculator에서 dispatch.
export interface TaxEngine {
  addLot(coin: string, lot: Lot): void;
  // 매도 시점에 코인 보유량에서 sellAmount만큼 차감, 차감된 cost basis 반환.
  // 보유량 부족 시 throw — orphan SELL 처리는 caller 책임.
  consumeLots(coin: string, sellAmount: number): ConsumeResult;
  getHoldings(): Map<string, Lot[]>;
  getLotsByCoin(coin: string): Lot[];
}
