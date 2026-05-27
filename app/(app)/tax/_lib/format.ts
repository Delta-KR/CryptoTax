import { toKSTDateStr } from '@/lib/engine/exchange-rate';

export function formatShortDate(iso: string): string {
  // KST 기준 — UTC 환경 분기 차이로 인한 표시 오류 방지.
  const kst = toKSTDateStr(new Date(iso)); // 'YYYY-MM-DD'
  return `${kst.slice(2, 4)}.${kst.slice(5, 7)}.${kst.slice(8, 10)}`;
}

export function formatAmount(n: number): string {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: 8 });
}
