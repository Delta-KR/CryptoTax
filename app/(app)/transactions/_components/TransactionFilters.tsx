import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { type ExchangeId } from '@/lib/client/transactions';

// 거래 목록 필터 바 — 거래소 / 코인 / 매수매도 / 검색.
// 모든 select 변경 시 page 1 으로 reset (부모 setter 가 처리).
export function TransactionFilters({
  exchange,
  setExchange,
  coin,
  setCoin,
  type,
  setType,
  search,
  setSearch,
  setPage,
  coinOptions,
}: {
  exchange: ExchangeId | 'all';
  setExchange: (v: ExchangeId | 'all') => void;
  coin: string;
  setCoin: (v: string) => void;
  type: 'all' | 'buy' | 'sell';
  setType: (v: 'all' | 'buy' | 'sell') => void;
  search: string;
  setSearch: (v: string) => void;
  setPage: (v: number) => void;
  coinOptions: string[];
}) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-line bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_2fr]">
      <Select
        value={exchange}
        onChange={(e) => {
          setExchange(e.target.value as ExchangeId | 'all');
          setPage(1);
        }}
        aria-label="거래소"
      >
        <option value="all">거래소 전체</option>
        <option value="upbit">업비트</option>
        <option value="binance">바이낸스</option>
      </Select>
      <Select
        value={coin}
        onChange={(e) => {
          setCoin(e.target.value);
          setPage(1);
        }}
        aria-label="코인"
      >
        <option value="all">코인 전체</option>
        {coinOptions.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select
        value={type}
        onChange={(e) => {
          setType(e.target.value as 'all' | 'buy' | 'sell');
          setPage(1);
        }}
        aria-label="구분"
      >
        <option value="all">매수/매도 전체</option>
        <option value="buy">매수만</option>
        <option value="sell">매도만</option>
      </Select>
      <Input
        placeholder="코인 / 거래소로 검색"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        leftIcon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        }
      />
    </div>
  );
}
