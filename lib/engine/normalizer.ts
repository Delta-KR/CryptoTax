import { v4 as uuid } from 'uuid';
import type { ParsedTransaction, UnifiedTransaction } from './types';
import type { ExchangeRateProvider } from './exchange-rate';
import { roundKRW } from './constants';

export async function normalize(
  parsed: ParsedTransaction[],
  rates: ExchangeRateProvider,
): Promise<UnifiedTransaction[]> {
  const result: UnifiedTransaction[] = [];

  for (const tx of parsed) {
    const feeKRW = roundKRW(
      tx.fee * (await rates.getRate(tx.date, tx.feeCurrency, 'KRW')),
    );

    if (tx.isSwap) {
      const quoteKRW = await rates.getRate(tx.date, tx.quoteCurrency, 'KRW');
      const baseKRWPerUnit = tx.pricePerUnit * quoteKRW;
      const baseTotalKRW = roundKRW(tx.amount * baseKRWPerUnit);
      const quoteTotalKRW = roundKRW(tx.total * quoteKRW);

      if (tx.type === 'SELL') {
        result.push({
          id: uuid(),
          date: tx.date,
          type: 'SELL',
          coin: tx.coin,
          amount: tx.amount,
          pricePerUnitKRW: roundKRW(baseKRWPerUnit),
          totalKRW: baseTotalKRW,
          feeKRW,
          exchange: tx.exchange,
          originalCurrency: tx.quoteCurrency,
        });
        result.push({
          id: uuid(),
          date: tx.date,
          type: 'BUY',
          coin: tx.quoteCurrency,
          amount: tx.total,
          pricePerUnitKRW: roundKRW(quoteKRW),
          totalKRW: quoteTotalKRW,
          feeKRW: 0,
          exchange: tx.exchange,
          originalCurrency: tx.quoteCurrency,
        });
      } else {
        result.push({
          id: uuid(),
          date: tx.date,
          type: 'SELL',
          coin: tx.quoteCurrency,
          amount: tx.total,
          pricePerUnitKRW: roundKRW(quoteKRW),
          totalKRW: quoteTotalKRW,
          feeKRW,
          exchange: tx.exchange,
          originalCurrency: tx.quoteCurrency,
        });
        result.push({
          id: uuid(),
          date: tx.date,
          type: 'BUY',
          coin: tx.coin,
          amount: tx.amount,
          pricePerUnitKRW: roundKRW(baseKRWPerUnit),
          totalKRW: baseTotalKRW,
          feeKRW: 0,
          exchange: tx.exchange,
          originalCurrency: tx.quoteCurrency,
        });
      }
    } else {
      const quoteRate = await rates.getRate(tx.date, tx.quoteCurrency, 'KRW');
      result.push({
        id: uuid(),
        date: tx.date,
        type: tx.type,
        coin: tx.coin,
        amount: tx.amount,
        pricePerUnitKRW: roundKRW(tx.pricePerUnit * quoteRate),
        totalKRW: roundKRW(tx.total * quoteRate),
        feeKRW,
        exchange: tx.exchange,
        originalCurrency: tx.quoteCurrency,
      });
    }
  }

  result.sort((a, b) => {
    const da = a.date.getTime();
    const db = b.date.getTime();
    if (da !== db) return da - db;
    if (a.type !== b.type) return a.type === 'BUY' ? -1 : 1;
    return 0;
  });

  return result;
}
