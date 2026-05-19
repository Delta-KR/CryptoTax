import type { Lot, ConsumedLot } from './types';
import type { ConsumeResult, TaxEngine } from './tax-engine';
import { roundCoin, roundKRW } from './constants';

export type { ConsumeResult } from './tax-engine';

export class FIFOEngine implements TaxEngine {
  private lots: Map<string, Lot[]> = new Map();

  addLot(coin: string, lot: Lot): void {
    let arr = this.lots.get(coin);
    if (!arr) {
      arr = [];
      this.lots.set(coin, arr);
    }
    arr.push(lot);
  }

  consumeLots(coin: string, sellAmount: number): ConsumeResult {
    const arr = this.lots.get(coin);
    const totalHeld = arr ? arr.reduce((s, l) => s + l.amount, 0) : 0;

    if (!arr || totalHeld < sellAmount - 1e-10) {
      throw new Error(
        `Insufficient lots for ${coin}: need ${sellAmount}, have ${totalHeld}`,
      );
    }

    let remaining = sellAmount;
    let costBasis = 0;
    let buyFee = 0;
    const consumed: ConsumedLot[] = [];

    while (remaining > 0 && arr.length > 0) {
      const lot = arr[0];
      const take = Math.min(lot.amount, remaining);
      const cost = take * lot.pricePerUnitKRW;
      const fee =
        lot.originalAmount > 0
          ? (take / lot.originalAmount) * lot.feeKRW
          : 0;

      consumed.push({
        lotId: lot.id,
        amount: roundCoin(take),
        pricePerUnitKRW: lot.pricePerUnitKRW,
        costKRW: roundKRW(cost),
      });

      costBasis += cost;
      buyFee += fee;

      lot.amount = roundCoin(lot.amount - take);
      remaining = roundCoin(remaining - take);

      if (lot.amount === 0) {
        arr.shift();
      }
    }

    if (arr.length === 0) {
      this.lots.delete(coin);
    }

    return {
      costBasisKRW: roundKRW(costBasis),
      consumedLots: consumed,
      buyFeeKRW: roundKRW(buyFee),
    };
  }

  getHoldings(): Map<string, Lot[]> {
    return this.lots;
  }

  getLotsByCoin(coin: string): Lot[] {
    return this.lots.get(coin) ?? [];
  }
}
