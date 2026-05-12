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
  blurred,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'good';
  bold?: boolean;
  blurred?: boolean;
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
          (tone === 'good' ? 'text-good' : 'text-ink') +
          (blurred ? ' select-none blur-[6px]' : '')
        }
        aria-hidden={blurred}
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

function PremiumBanner() {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-brand/40 bg-brand-faint px-6 py-5 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold tracking-[-0.01em] text-ink">
            🔒 정확한 납부세액과 코인별 상세 손익은 프리미엄 전용입니다
          </span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-[1.55] text-muted">
          업그레이드하면 정확한 세액 + 코인별 손익표 + PDF 리포트 다운로드까지 모두 이용 가능합니다.
        </p>
      </div>
      <Link href="/billing/checkout?plan=premium" className="flex-shrink-0">
        <Button className="whitespace-nowrap">전체 결과 보기 — ₩19,900</Button>
      </Link>
    </div>
  );
}

function BlurOverlay({ children, masked }: { children: React.ReactNode; masked: boolean }) {
  if (!masked) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[8px]" aria-hidden>
        {children}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-card/90 px-4 py-2 text-[12px] font-semibold text-brand shadow-md ring-1 ring-brand/30">
          🔒 프리미엄 전용
        </div>
      </div>
    </div>
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

  const masked = result.masked;

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

      {masked && <PremiumBanner />}

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
        <BlurOverlay masked={masked}>
          <StatCard
            label="과세표준"
            value={formatKrw(result.taxable)}
            sub="총 양도차익 − 공제"
          />
        </BlurOverlay>
        <BlurOverlay masked={masked}>
          <StatCard
            label="납부세액"
            value={formatKrw(result.tax)}
            tone="brand"
            sub="과세표준 × 22%"
          />
        </BlurOverlay>
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
            blurred={masked}
          />
          <CalcRow
            label="× 세율"
            value="22%"
            sub="소득세 20% + 지방세 2%"
          />
          <Divider thick />
          <div className="relative mt-2">
            <div
              className={
                'rounded-md bg-brand px-5 py-4 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] ' +
                (masked ? 'pointer-events-none select-none blur-[8px]' : '')
              }
              aria-hidden={masked}
            >
              <div className="text-[12px] font-medium opacity-90">
                {year}년 5월 납부 세액
              </div>
              <div className="num mt-1 text-[28px] font-extrabold tracking-tighter3">
                {formatKrw(result.tax).replace('+', '')}
              </div>
            </div>
            {masked && (
              <Link
                href="/billing/checkout?plan=premium"
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="rounded-full bg-white px-4 py-2 text-[12px] font-bold text-brand shadow-lg">
                  🔒 전체 결과 보기 — ₩19,900
                </span>
              </Link>
            )}
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
            <div className="relative">
              <div
                className={
                  masked
                    ? 'pointer-events-none select-none blur-[8px]'
                    : ''
                }
                aria-hidden={masked}
              >
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
              </div>
              {masked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="rounded-full bg-card/95 px-5 py-3 text-[13px] font-bold text-brand shadow-lg ring-1 ring-brand/30">
                    🔒 코인별 손익은 프리미엄 전용
                  </div>
                  <Link href="/billing/checkout?plan=premium">
                    <Button size="sm">전체 결과 보기 — ₩19,900</Button>
                  </Link>
                </div>
              )}
            </div>
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
