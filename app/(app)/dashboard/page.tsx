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
import { CoinIcon } from '@/components/ui/CoinIcon';
import {
  getTransactions,
  exchangeLabel,
  type Transaction,
} from '@/lib/client/transactions';
import { calculateTax, getTaxMethod, formatKrw, type TaxMethod } from '@/lib/client/tax';
import { kstYearOf } from '@/lib/engine/exchange-rate';

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
    color: 'rgb(var(--brand))',
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
    // DESIGN.md §3: 보라(#7C3AED) 금지. 단일 brand blue 로 통일.
    color: 'rgb(var(--brand))',
    soft: 'rgb(var(--brand-soft))',
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
    color: 'rgb(var(--good))',
    soft: 'rgb(var(--good-soft))',
  },
];

export default function DashboardPage() {
  const [year, setYear] = useState(2027);
  const [method, setMethod] = useState<TaxMethod>('totalAverage');
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
        // KST 기준 연도 — Vercel UTC 환경에서 새해 1일 거래가 누락되지 않도록.
        .filter((t) => kstYearOf(new Date(t.date)) === year)
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
        description={`${year}년 양도소득 현황 · ${method === 'totalAverage' ? '총평균법' : method === 'fifo' ? '선입선출법' : '이동평균법'}`}
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
          label="순손익"
          value={formatKrw(result.netPnL)}
          tone={result.netPnL >= 0 ? 'good' : 'bad'}
          sub={`총 양도차익 ${formatKrw(result.totalGain)} − 손실 ${formatKrw(result.totalLoss)}`}
        />
        <StatCard
          label="기본공제"
          value={`−${formatKrw(result.deduction).replace('+', '').replace('−', '')}`}
          sub="연 1회 자동 적용"
        />
        {result.masked ? (
          <Link
            href="/billing"
            className="group relative block"
          >
            <div className="pointer-events-none select-none blur-[10px]" aria-hidden>
              <StatCard
                label="예상 납부세액"
                value={formatKrw(result.tax)}
                tone="brand"
                sub={`과세표준 × 22% (소득세 20% + 지방세 2%)`}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-gradient-to-br from-brand/15 via-transparent to-brand/15 transition-colors group-hover:from-brand/25 group-hover:to-brand/25">
              <div
                className="rounded-full px-3.5 py-1.5 text-[11.5px] font-extrabold text-white shadow-[0_4px_14px_rgba(37,99,235,0.45)] transition-transform group-hover:scale-110"
                style={{ background: 'rgb(var(--brand))' }}
              >
                프리미엄 전용
              </div>
            </div>
          </Link>
        ) : (
          <StatCard
            label="예상 납부세액"
            value={formatKrw(result.tax)}
            tone="brand"
            sub={`과세표준 × 22% (소득세 20% + 지방세 2%)`}
          />
        )}
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
            세율 22% (20% + 2%)
          </Pill>
        </div>
        {chartItems.length > 0 ? (
          result.masked ? (
            <Link
              href="/billing"
              className="group relative block"
            >
              <div className="pointer-events-none select-none blur-[10px]" aria-hidden>
                <BarChart
                  items={chartItems}
                  formatter={(n) => formatKrw(n).replace('₩', '₩ ')}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand shadow-md ring-1 ring-brand/30">
                  Premium Only
                </div>
                <div className="text-[13px] font-bold text-ink">
                  코인별 정확한 손익을 확인하세요
                </div>
                <button
                  type="button"
                  className="relative whitespace-nowrap rounded-md px-5 py-2.5 text-[13px] font-extrabold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.6)] transition-transform group-hover:scale-105"
                  style={{
                    background:
                      'linear-gradient(135deg, rgb(var(--brand)) 0%, rgb(124,58,237) 100%)',
                  }}
                >
                  <span
                    className="absolute inset-0 -z-10 animate-pulse rounded-md blur-md"
                    style={{ background: 'rgb(37,99,235)' }}
                  />
                  유료 플랜 보기 →
                </button>
              </div>
            </Link>
          ) : (
            <BarChart
              items={chartItems}
              formatter={(n) => formatKrw(n).replace('₩', '₩ ')}
            />
          )
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
