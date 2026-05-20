import { v4 as uuid } from 'uuid';
import type {
  ParsedTransaction,
  RateMeta,
  UnifiedTransaction,
} from './types';
import type {
  ExchangeRateProvider,
  RateResolution,
} from './exchange-rate';
import { roundKRW } from './constants';

// quoteCurrency가 KRW면 환율 적용 없음 → rateMeta=undefined.
function toRateMeta(
  quoteCurrency: string,
  resolution: RateResolution,
): RateMeta | undefined {
  if (quoteCurrency === 'KRW') return undefined;
  return {
    rateKRW: resolution.rate,
    sourceDate: resolution.sourceDate,
    source: resolution.source,
    sourceName: resolution.sourceName,
  };
}

export async function normalize(
  parsed: ParsedTransaction[],
  rates: ExchangeRateProvider,
): Promise<UnifiedTransaction[]> {
  const result: UnifiedTransaction[] = [];

  for (const tx of parsed) {
    const feeRes = await rates.getRateWithMeta(tx.date, tx.feeCurrency, 'KRW');
    const feeKRW = roundKRW(tx.fee * feeRes.rate);

    if (tx.isSwap) {
      const quoteRes = await rates.getRateWithMeta(
        tx.date,
        tx.quoteCurrency,
        'KRW',
      );
      const quoteKRW = quoteRes.rate;
      const rateMeta = toRateMeta(tx.quoteCurrency, quoteRes);
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
          rateMeta,
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
          rateMeta,
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
          rateMeta,
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
          rateMeta,
        });
      }
    } else {
      const quoteRes = await rates.getRateWithMeta(
        tx.date,
        tx.quoteCurrency,
        'KRW',
      );
      result.push({
        id: uuid(),
        date: tx.date,
        type: tx.type,
        coin: tx.coin,
        amount: tx.amount,
        pricePerUnitKRW: roundKRW(tx.pricePerUnit * quoteRes.rate),
        totalKRW: roundKRW(tx.total * quoteRes.rate),
        feeKRW,
        exchange: tx.exchange,
        originalCurrency: tx.quoteCurrency,
        rateMeta: toRateMeta(tx.quoteCurrency, quoteRes),
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
