'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pill } from '@/components/ui/Pill';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';
import {
  getTransactions,
  exchangeLabel,
  type Transaction,
  type ExchangeId,
} from '@/lib/mock/transactions';

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const [all, setAll] = useState<Transaction[]>([]);
  const [exchange, setExchange] = useState<ExchangeId | 'all'>('all');
  const [coin, setCoin] = useState<string>('all');
  const [type, setType] = useState<'all' | 'buy' | 'sell'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setAll(getTransactions());
  }, []);

  const filtered = useMemo(() => {
    return all.filter((t) => {
      if (exchange !== 'all' && t.exchange !== exchange) return false;
      if (coin !== 'all' && t.coin !== coin) return false;
      if (type !== 'all' && t.type !== type) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${t.coin} ${exchangeLabel[t.exchange]} ${t.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, exchange, coin, type, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 코인 옵션은 데이터에서 도출
  const coinOptions = useMemo(
    () => Array.from(new Set(all.map((t) => t.coin))).sort(),
    [all]
  );

  return (
    <>
      <PageHeader
        title="거래 내역"
        description={`총 ${filtered.length}건 · ${all.length}건 중 필터링`}
        right={
          <Link href="/transactions/upload">
            <Button
              leftIcon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 14V2M8 2l-4 4M8 2l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              CSV 업로드
            </Button>
          </Link>
        }
      />

      {/* Filter bar */}
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
          <option value="bithumb">빗썸</option>
          <option value="binance">바이낸스</option>
          <option value="bybit">바이빗</option>
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

      {pageItems.length > 0 ? (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>날짜</TableHeaderCell>
                <TableHeaderCell>거래소</TableHeaderCell>
                <TableHeaderCell>코인</TableHeaderCell>
                <TableHeaderCell>구분</TableHeaderCell>
                <TableHeaderCell className="text-right">수량</TableHeaderCell>
                <TableHeaderCell className="text-right">단가</TableHeaderCell>
                <TableHeaderCell className="text-right">금액</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="num text-[12px] text-muted">
                    {new Date(tx.date).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{exchangeLabel[tx.exchange]}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <CoinIcon coin={tx.coin} size={22} />
                      <span className="font-semibold">{tx.coin}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Pill tone={tx.type === 'buy' ? 'good' : 'bad'} size="sm">
                      {tx.type === 'buy' ? '매수' : '매도'}
                    </Pill>
                  </TableCell>
                  <TableCell className="num text-right text-[12px]">
                    {tx.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="num text-right text-[12px] text-muted">
                    ₩{tx.pricePerCoin.toLocaleString()}
                  </TableCell>
                  <TableCell className="num text-right text-[13px] font-semibold text-ink">
                    ₩{tx.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-[13px] text-muted">
              <span>
                {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  이전
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-line bg-card">
          <EmptyState
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            }
            title={all.length === 0 ? '아직 거래 내역이 없습니다' : '조건에 맞는 거래가 없습니다'}
            description={
              all.length === 0
                ? '거래소 CSV/PDF/XLS 파일을 업로드하면 자동으로 통합됩니다.'
                : '필터를 조정하거나 검색어를 변경해보세요.'
            }
            action={
              all.length === 0 ? (
                <Link href="/transactions/upload">
                  <Button>CSV 업로드</Button>
                </Link>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setExchange('all');
                    setCoin('all');
                    setType('all');
                    setSearch('');
                  }}
                >
                  필터 초기화
                </Button>
              )
            }
          />
        </div>
      )}
    </>
  );
}
