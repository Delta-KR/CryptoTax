'use client';
import { useEffect, useMemo, useState } from 'react';
import { Select } from '@/components/ui/Select';
import {
  getTransactions,
  type Transaction,
} from '@/lib/client/transactions';
import { calculateTax, getTaxMethod, type TaxMethod } from '@/lib/client/tax';
import { kstYearOf } from '@/lib/engine/exchange-rate';
import { DashboardStatCards } from './_components/DashboardStatCards';
import { DashboardCoinChart } from './_components/DashboardCoinChart';
import { DashboardRecentTransactions } from './_components/DashboardRecentTransactions';
import { DashboardQuickActions } from './_components/DashboardQuickActions';

// dashboard 전용 PageHeader inline — app-chrome/PageHeader 와 markup 다름.
// 시각 회귀 위험으로 분리 없이 유지 (다른 페이지는 app-chrome 사용).
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

  const exchangeCount = new Set(transactions.map((t) => t.exchange)).size;

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

      <DashboardStatCards
        netPnL={result.netPnL}
        totalGain={result.totalGain}
        totalLoss={result.totalLoss}
        deduction={result.deduction}
        tax={result.tax}
        masked={result.masked}
        transactionCount={result.transactionCount}
        exchangeCount={exchangeCount}
      />

      <DashboardCoinChart
        chartItems={chartItems}
        masked={result.masked}
        year={year}
      />

      <DashboardRecentTransactions recent={recent} year={year} />

      <DashboardQuickActions />
    </>
  );
}
