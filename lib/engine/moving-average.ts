import type { Lot } from './types';
import type { ConsumeResult, TaxEngine } from './tax-engine';
import { roundCoin, roundKRW } from './constants';

// 코인별 running total. 평균 단가는 동적으로 계산 (totalCostKRW / totalAmount).
// 원본 lots를 보관해 holdingsAfter와 추후 audit trail에서 매수 시점 정보 노출 가능.
interface MAState {
  totalAmount: number;
  totalCostKRW: number;
  totalFeeKRW: number;
  lots: Lot[];
}

export class MAEngine implements TaxEngine {
  private state: Map<string, MAState> = new Map();

  addLot(coin: string, lot: Lot): void {
    let s = this.state.get(coin);
    if (!s) {
      s = { totalAmount: 0, totalCostKRW: 0, totalFeeKRW: 0, lots: [] };
      this.state.set(coin, s);
    }
    s.totalAmount = roundCoin(s.totalAmount + lot.amount);
    s.totalCostKRW += lot.amount * lot.pricePerUnitKRW;
    s.totalFeeKRW += lot.feeKRW;
    s.lots.push(lot);
  }

  consumeLots(coin: string, sellAmount: number): ConsumeResult {
    const s = this.state.get(coin);
    const totalHeld = s ? s.totalAmount : 0;

    if (!s || totalHeld < sellAmount - 1e-10) {
      throw new Error(
        `Insufficient lots for ${coin}: need ${sellAmount}, have ${totalHeld}`,
      );
    }

    const avgCost = s.totalCostKRW / s.totalAmount;
    const avgFee = s.totalFeeKRW / s.totalAmount;
    const costBasis = sellAmount * avgCost;
    const buyFee = sellAmount * avgFee;

    // 비례 차감: running totals.
    const ratio = sellAmount / s.totalAmount;
    s.totalAmount = roundCoin(s.totalAmount - sellAmount);
    s.totalCostKRW -= costBasis;
    s.totalFeeKRW -= buyFee;

    // 비례 차감: 원본 lots (holdingsAfter 정확성).
    // 각 lot의 amount를 (1-ratio) 배율로 축소. 원본 price/exchange/date는 그대로 유지.
    s.lots = s.lots
      .map((l) => ({ ...l, amount: roundCoin(l.amount * (1 - ratio)) }))
      .filter((l) => l.amount > 1e-10);

    // 매도 완료로 코인이 비면 state에서 제거.
    if (s.totalAmount <= 1e-10 || s.lots.length === 0) {
      this.state.delete(coin);
    }

    return {
      costBasisKRW: roundKRW(costBasis),
      buyFeeKRW: roundKRW(buyFee),
      consumedLots: [
        {
          lotId: `avg:${coin}`,
          amount: roundCoin(sellAmount),
          pricePerUnitKRW: roundKRW(avgCost),
          costKRW: roundKRW(costBasis),
        },
      ],
    };
  }

  getHoldings(): Map<string, Lot[]> {
    const out = new Map<string, Lot[]>();
    for (const [coin, s] of this.state) {
      if (s.lots.length > 0) out.set(coin, s.lots);
    }
    return out;
  }

  getLotsByCoin(coin: string): Lot[] {
    return this.state.get(coin)?.lots ?? [];
  }
}
