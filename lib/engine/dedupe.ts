import type { ParsedTransaction } from './types';

// 같은 파일(또는 기간 겹친 파일)이 두 번 업로드되면 cost basis가 2배가 되어
// 손익이 완전히 부정확해짐. 거래소 native ID는 parser별로 다르거나 부재해서
// 자연 키 (모든 필드 일치)로 dedup.
//
// 같은 분 안에 같은 수량/가격으로 두 번 거래되는 케이스(봇)는 거의 없고,
// 있더라도 fee/total까지 100% 일치할 확률은 극히 낮아 false positive 위험 작음.
function makeKey(tx: ParsedTransaction): string {
  return [
    tx.exchange,
    tx.date.getTime(),
    tx.type,
    tx.coin,
    tx.amount.toFixed(10),
    tx.pricePerUnit.toFixed(10),
    tx.total.toFixed(10),
    tx.fee.toFixed(10),
    tx.quoteCurrency,
    tx.feeCurrency,
    tx.isSwap ? '1' : '0',
  ].join('|');
}

export interface DedupeResult {
  unique: ParsedTransaction[];
  duplicates: number;
}

export function dedupeParsedTransactions(
  txs: ParsedTransaction[],
): DedupeResult {
  const seen = new Set<string>();
  const unique: ParsedTransaction[] = [];
  for (const tx of txs) {
    const key = makeKey(tx);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(tx);
  }
  return { unique, duplicates: txs.length - unique.length };
}
