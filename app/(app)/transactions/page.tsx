'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getTransactions,
  exchangeLabel,
  type Transaction,
  type ExchangeId,
} from '@/lib/client/transactions';
import { TransactionFilters } from './_components/TransactionFilters';
import { TransactionsTable } from './_components/TransactionsTable';
import { DataBackupCard } from './_components/DataBackupCard';

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const [all, setAll] = useState<Transaction[]>([]);
  const [exchange, setExchange] = useState<ExchangeId | 'all'>('all');
  const [coin, setCoin] = useState<string>('all');
  const [type, setType] = useState<'all' | 'buy' | 'sell'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // P1 #8: 거래별 펼치기 — 환율 출처 audit trail
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

      <TransactionFilters
        exchange={exchange}
        setExchange={setExchange}
        coin={coin}
        setCoin={setCoin}
        type={type}
        setType={setType}
        search={search}
        setSearch={setSearch}
        setPage={setPage}
        coinOptions={coinOptions}
      />

      {pageItems.length > 0 ? (
        <TransactionsTable
          pageItems={pageItems}
          expanded={expanded}
          toggleExpand={toggleExpand}
          safePage={safePage}
          totalPages={totalPages}
          filteredCount={filtered.length}
          pageSize={PAGE_SIZE}
          setPage={setPage}
        />
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
                ? '거래소 CSV/PDF/XLS 파일을 업로드하면 자동으로 통합돼요.'
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

      <DataBackupCard />
    </>
  );
}
