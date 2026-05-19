import type { StaticRateEntry } from './exchange-rate';

// 정적 환율 fallback. DB(daily_rates 테이블)에 데이터가 없을 때만 사용.
// 분기별 대표값이라 일별 정확도 부족 — production에서는 Edge function
// `fetch-daily-rates`로 Upbit 실시간 종가를 DB에 적재해 사용.
//
// 갱신: ECOS 또는 Upbit 데이터를 받으면 production은 DB로 자동 fallback,
// 본 파일은 신규 환경/오프라인 fallback용으로만 유지.
export const RATES_FALLBACK_SOURCE = {
  name: '정적 분기별 fallback (Upbit/ECOS 데이터 미적재 시)',
  generatedAt: '2026-05-19',
} as const;

export const DAILY_RATES_FALLBACK: readonly StaticRateEntry[] = [
  ['2024-01-01', 'USDT', 'KRW', 1330],
  ['2024-04-01', 'USDT', 'KRW', 1370],
  ['2024-07-01', 'USDT', 'KRW', 1380],
  ['2024-10-01', 'USDT', 'KRW', 1370],
  ['2025-01-01', 'USDT', 'KRW', 1450],
  ['2025-04-01', 'USDT', 'KRW', 1440],
  ['2025-07-01', 'USDT', 'KRW', 1395],
  ['2025-10-01', 'USDT', 'KRW', 1500],
  ['2026-01-01', 'USDT', 'KRW', 1460],
  ['2026-04-01', 'USDT', 'KRW', 1488],
  ['2026-07-01', 'USDT', 'KRW', 1450],
  ['2026-10-01', 'USDT', 'KRW', 1500],
  ['2027-01-01', 'USDT', 'KRW', 1480],
  ['2027-04-01', 'USDT', 'KRW', 1500],
  ['2027-07-01', 'USDT', 'KRW', 1520],
  ['2027-10-01', 'USDT', 'KRW', 1550],
  ['2024-07-01', 'BTC', 'KRW', 80_000_000],
  ['2026-12-31', 'BTC', 'KRW', 150_000_000],
  ['2027-01-01', 'BTC', 'KRW', 150_000_000],
  ['2027-07-01', 'BTC', 'KRW', 160_000_000],
];

// 의제취득가액 시가 — 2026.12.31 기준. Phase 8 (P0 #5)에서 외부 가격 API + 사용자 입력 UI로 대체.
// 현재는 코드 베이스에 박힌 fallback. 미보유 코인은 'pricePerUnitKRW' 실가로 처리되며 warning 발생.
export const DEEMED_COST_SNAPSHOTS = new Map<string, number>([
  ['USDT', 1500],
  ['USDC', 1500],
  ['BTC', 150_000_000],
  ['ETH', 5_000_000],
  ['SOL', 300_000],
  ['XRP', 800],
  ['DUSK', 5],
  ['GOAT', 800],
  ['ETC', 30_000],
  ['1000FLOKI', 200],
]);
