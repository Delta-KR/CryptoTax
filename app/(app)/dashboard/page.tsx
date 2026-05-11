'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Select } from '@/components/ui/Select';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { BarChart } from '@/components/ui/Chart/BarChart';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';
import { HoverCard } from '@/components/ui/HoverCard';
import { Pill } from '@/components/ui/Pill';
import {
  getTransactions,
  exchangeLabel,
  type Transaction,
} from '@/lib/mock/transactions';
import { calculateTax, getTaxMethod, formatKrw, type TaxMethod } from '@/lib/mock/tax';

function PageHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tighter3 text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-body text-muted">{description}</p>
        )}
      </div>
      {right}
    </div>
  );
}

const quickActions = [
  {
    href: '/transactions/upload',
    label: '거래 데이터 업로드',
    description: 'CSV / PDF / XLS 파일 통합',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    color: '#2563EB',
    soft: 'rgb(var(--brand-faint))',
  },
  {
    href: '/tax',
    label: '세금 계산',
    description: '한국 세법 기준 자동 계산',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    color: '#7C3AED',
    soft: '#F5F3FF',
  },
  {
    href: '/report',
    label: 'PDF 리포트',
    description: '신고용 항목별 정리 PDF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 3v5h5M9 14l3 3 3-3M12 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: '#16A34A',
    soft: '#ECFDF5',
  },
];

const coinColors: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#9945FF',
  XRP: '#23292F',
  DOGE: '#C2A633',
};

export default function DashboardPage() {
  const [year, setYear] = useState(2027);
  const [method, setMethod] = useState<TaxMethod>('fifo');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setMethod(getTaxMethod());
    setTransactions(getTransactions());
  }, []);

  const result = useMemo(
    () => calculateTax(transactions, method, year),
    [transactions, method, year]
  );

  const recent = useMemo(
    () =>
      [...transactions]
        .filter((t) => new Date(t.date).getFullYear() === year)
        .slice(0, 5),
    [transactions, year]
  );

  const chartItems = useMemo(
    () =>
      result.perCoin.slice(0, 5).map((c) => ({
        label: c.coin,
        value: c.gain,
        gain: c.gain >= 0,
      })),
    [result.perCoin]
  );

  return (
    <>
      <PageHeader
        title="대시보드"
        description={`${year}년 양도소득 현황 · ${method === 'fifo' ? '선입선출법' : '이동평균법'}`}
        right={
          <Select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="min-w-[120px]"
          >
            <option value={2027}>2027년</option>
            <option value={2026}>2026년</option>
          </Select>
        }
      />

      {/* 4 StatCards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="총 양도차익"
          value={formatKrw(result.totalGain)}
          tone={result.totalGain >= 0 ? 'good' : 'bad'}
          sub={`${year}년 귀속`}
        />
        <StatCard
          label="기본공제"
          value={`−${formatKrw(result.deduction).replace('+', '').replace('−', '')}`}
          sub="연 1회 자동 적용"
        />
        <StatCard
          label="예상 납부세액"
          value={formatKrw(result.tax)}
          tone="brand"
          sub={`과세표준 × 22%`}
        />
        <StatCard
          label="통합 거래수"
          value={`${result.transactionCount}건`}
          sub={`${[...new Set(transactions.map((t) => t.exchange))].length}개 거래소`}
        />
      </div>

      {/* 코인별 손익 차트 */}
      <Card className="mt-6" padding="md">
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-ink">코인별 손익</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {year}년 양도차익 상위 5개
            </p>
          </div>
          <Pill tone="brand" size="sm">
            22% 세율
          </Pill>
        </div>
        {chartItems.length > 0 ? (
          <BarChart
            items={chartItems}
            formatter={(n) => formatKrw(n).replace('₩', '₩ ')}
          />
        ) : (
          <p className="py-6 text-center text-[13px] text-muted">
            {year}년 매도 거래가 없습니다.
          </p>
        )}
      </Card>

      {/* 최근 거래 */}
      <Card className="mt-6" padding="none">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-ink">최근 거래</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {year}년 거래 중 최신 5건
            </p>
          </div>
          <Link
            href="/transactions"
            className="text-[13px] font-semibold text-brand hover:underline"
          >
            전체 보기 →
          </Link>
        </div>
        {recent.length > 0 ? (
          <Table className="border-t border-line-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>날짜</TableHeaderCell>
                <TableHeaderCell>거래소</TableHeaderCell>
                <TableHeaderCell>코인</TableHeaderCell>
                <TableHeaderCell>구분</TableHeaderCell>
                <TableHeaderCell className="text-right">수량</TableHeaderCell>
                <TableHeaderCell className="text-right">금액</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="num text-[12px] text-muted">
                    {new Date(tx.date).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>{exchangeLabel[tx.exchange]}</TableCell>
                  <TableCell>
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: `${coinColors[tx.coin] ?? '#888'}18`,
                        color: coinColors[tx.coin] ?? 'rgb(var(--ink))',
                      }}
                    >
                      {tx.coin.slice(0, 1)}
                    </span>{' '}
                    {tx.coin}
                  </TableCell>
                  <TableCell>
                    <Pill tone={tx.type === 'buy' ? 'good' : 'bad'} size="sm">
                      {tx.type === 'buy' ? '매수' : '매도'}
                    </Pill>
                  </TableCell>
                  <TableCell className="num text-right text-[12px]">
                    {tx.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="num text-right text-[13px] font-semibold text-ink">
                    ₩{tx.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="border-t border-line-2 px-6 py-12 text-center text-[13px] text-muted">
            {year}년 거래가 없습니다.
          </p>
        )}
      </Card>

      {/* 빠른 액션 */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {quickActions.map((a) => (
          <HoverCard
            key={a.href}
            className="rounded-lg border border-line bg-card p-5 shadow-sm"
          >
            <Link href={a.href} className="block">
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-md"
                style={{
                  background: `color-mix(in srgb, ${a.color} 12%, rgb(var(--card)))`,
                  color: a.color,
                }}
              >
                {a.icon}
              </div>
              <div className="text-[15px] font-bold text-ink">{a.label}</div>
              <div className="mt-1 text-[12px] text-muted">{a.description}</div>
            </Link>
          </HoverCard>
        ))}
      </div>
    </>
  );
}
