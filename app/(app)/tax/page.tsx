'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { CoinIcon } from '@/components/ui/CoinIcon';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { getTransactions, type Transaction } from '@/lib/mock/transactions';
import { calculateTax, formatKrw, getTaxMethod, type TaxMethod } from '@/lib/mock/tax';

function CalcRow({
  label,
  value,
  sub,
  tone,
  bold,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'good';
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <div className="min-w-0">
        <div
          className={
            'nowrap text-[13px] ' +
            (bold ? 'font-bold text-ink' : 'font-medium text-muted')
          }
        >
          {label}
        </div>
        {sub && <div className="nowrap mt-px text-[11px] text-muted-2">{sub}</div>}
      </div>
      <div
        className={
          'num nowrap tracking-[-0.01em] ' +
          (bold ? 'text-[18px] font-bold' : 'text-[16px] font-semibold') +
          ' ' +
          (tone === 'good' ? 'text-good' : 'text-ink')
        }
      >
        {value}
      </div>
    </div>
  );
}

function Divider({ thick }: { thick?: boolean }) {
  return (
    <div
      className={'my-2 ' + (thick ? 'h-0.5 bg-ink/10' : 'h-px bg-line-2')}
    />
  );
}

export default function TaxPage() {
  const toast = useToast();
  const [year, setYear] = useState(2027);
  const [method, setMethod] = useState<TaxMethod>('fifo');
  const [txs, setTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    setMethod(getTaxMethod());
    setTxs(getTransactions());
  }, []);

  const result = useMemo(
    () => calculateTax(txs, method, year),
    [txs, method, year]
  );

  return (
    <>
      <PageHeader
        title="세금 계산"
        description={`${year}년 양도소득 · ${method === 'fifo' ? '선입선출법' : '이동평균법'} 적용`}
        right={
          <div className="flex items-center gap-2">
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="연도"
            >
              <option value={2027}>2027년</option>
              <option value={2026}>2026년</option>
            </Select>
            <Button
              variant="secondary"
              onClick={() => toast.show('세금 계산이 재실행되었습니다.', 'success')}
            >
              재계산
            </Button>
          </div>
        }
      />

      {/* 4 StatCards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="총 양도차익"
          value={formatKrw(result.totalGain)}
          tone={result.totalGain >= 0 ? 'good' : 'bad'}
          sub={`${result.transactionCount}건 거래`}
        />
        <StatCard
          label="기본공제"
          value={`−${formatKrw(result.deduction).replace('+', '').replace('−', '')}`}
          sub="연 1회 자동 적용"
        />
        <StatCard
          label="과세표준"
          value={formatKrw(result.taxable)}
          sub="총 양도차익 − 공제"
        />
        <StatCard
          label="납부세액"
          value={formatKrw(result.tax)}
          tone="brand"
          sub="과세표준 × 22%"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Calc flow */}
        <Card padding="lg">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-ink">계산 흐름</h2>
            <Link
              href="/tax/settings"
              className="text-[12px] font-semibold text-brand hover:underline"
            >
              방식 변경 →
            </Link>
          </div>
          <CalcRow
            label="총 양도차익"
            value={formatKrw(result.totalGain)}
            tone="good"
          />
          <CalcRow label="기본공제" value="−250만원" sub="연 1회" />
          <Divider />
          <CalcRow
            label="과세표준"
            value={formatKrw(result.taxable)}
            bold
          />
          <CalcRow
            label="× 세율"
            value="22%"
            sub="소득세 20% + 지방세 2%"
          />
          <Divider thick />
          <div className="mt-2 rounded-md bg-brand px-5 py-4 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)]">
            <div className="text-[12px] font-medium opacity-90">
              {year}년 5월 납부 세액
            </div>
            <div className="num mt-1 text-[28px] font-extrabold tracking-tighter3">
              {formatKrw(result.tax).replace('+', '')}
            </div>
          </div>
        </Card>

        {/* 코인별 손익 */}
        <Card padding="none">
          <div className="px-6 py-4">
            <h2 className="text-[16px] font-bold text-ink">코인별 손익</h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {year}년 매도 거래 기준
            </p>
          </div>
          {result.perCoin.length > 0 ? (
            <Table className="border-t border-line-2">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>코인</TableHeaderCell>
                  <TableHeaderCell className="text-right">손익</TableHeaderCell>
                  <TableHeaderCell className="text-right">매도금액</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.perCoin.map((c) => (
                  <TableRow key={c.coin}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <CoinIcon coin={c.coin} size={22} />
                        <span className="font-semibold">{c.coin}</span>
                      </span>
                    </TableCell>
                    <TableCell
                      className={
                        'num text-right text-[13px] font-bold ' +
                        (c.gain >= 0 ? 'text-good' : 'text-bad')
                      }
                    >
                      {formatKrw(c.gain)}
                    </TableCell>
                    <TableCell className="num text-right text-[12px] text-muted">
                      ₩{c.volume.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="border-t border-line-2 px-6 py-12 text-center text-[13px] text-muted">
              {year}년 매도 거래가 없습니다.
            </p>
          )}
          {result.perCoin.length > 0 && (
            <div className="border-t border-line-2 px-6 py-3">
              <Pill tone="brand" size="sm">
                {method === 'fifo' ? '선입선출법(FIFO)' : '이동평균법(MA)'}
              </Pill>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
