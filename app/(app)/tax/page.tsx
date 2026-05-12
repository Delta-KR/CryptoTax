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
    <div
      className="mb-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-[14px] px-7 py-6 shadow-[0_10px_30px_-12px_rgba(37,99,235,0.5)] sm:flex-row sm:items-center"
      style={{
        background:
          'linear-gradient(135deg, rgb(var(--brand)) 0%, rgb(37,99,235) 60%, rgb(124,58,237) 100%)',
      }}
    >
      <div className="min-w-0 text-white">
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] backdrop-blur-sm">
          🔒 Premium Only
        </div>
        <div className="text-[18px] font-extrabold leading-[1.3] tracking-[-0.01em]">
          정확한 납부세액 + 코인별 손익 + PDF 리포트
        </div>
        <p className="mt-1 text-[13px] leading-[1.5] text-white/85">
          지금 업그레이드하면 모든 결과를 풀어드립니다.
        </p>
      </div>
      <Link href="/billing/checkout?plan=premium" className="flex-shrink-0">
        <button
          type="button"
          className="group relative whitespace-nowrap rounded-md bg-white px-5 py-3 text-[14px] font-extrabold text-brand shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-105"
        >
          <span className="absolute inset-0 -z-10 animate-pulse rounded-md bg-white/60 blur-md" />
          전체 결과 보기 · ₩19,900 →
        </button>
      </Link>
    </div>
  );
}

function BlurOverlay({
  children,
  masked,
  href = '/billing/checkout?plan=premium',
}: {
  children: React.ReactNode;
  masked: boolean;
  href?: string;
}) {
  if (!masked) return <>{children}</>;
  return (
    <Link href={href} className="group relative block">
      <div className="pointer-events-none select-none blur-[10px]" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-gradient-to-br from-brand/15 via-transparent to-brand/15 transition-colors group-hover:from-brand/25 group-hover:to-brand/25">
        <div
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-extrabold text-white shadow-[0_4px_14px_rgba(37,99,235,0.45)] transition-transform group-hover:scale-110"
          style={{ background: 'rgb(var(--brand))' }}
        >
          🔒 잠금 해제 · ₩19,900
        </div>
      </div>
    </Link>
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
                (masked ? 'pointer-events-none select-none blur-[10px]' : '')
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
                className="group absolute inset-0 flex flex-col items-center justify-center gap-2"
              >
                <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand shadow-md">
                  🔒 Locked
                </div>
                <button
                  type="button"
                  className="relative whitespace-nowrap rounded-md bg-white px-5 py-2.5 text-[13px] font-extrabold text-brand shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform group-hover:scale-110"
                >
                  <span className="absolute inset-0 -z-10 animate-pulse rounded-md bg-white/70 blur-lg" />
                  정확한 세액 보기 · ₩19,900 →
                </button>
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
                <Link
                  href="/billing/checkout?plan=premium"
                  className="group absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
                >
                  <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand shadow-md ring-1 ring-brand/30">
                    🔒 Premium Only
                  </div>
                  <div className="text-[14px] font-bold text-ink">
                    코인별 정확한 손익을 확인하세요
                  </div>
                  <button
                    type="button"
                    className="relative whitespace-nowrap rounded-md px-6 py-3 text-[14px] font-extrabold text-white shadow-[0_10px_28px_-8px_rgba(37,99,235,0.65)] transition-transform group-hover:scale-105"
                    style={{
                      background:
                        'linear-gradient(135deg, rgb(var(--brand)) 0%, rgb(124,58,237) 100%)',
                    }}
                  >
                    <span
                      className="absolute inset-0 -z-10 animate-pulse rounded-md blur-md"
                      style={{ background: 'rgb(37,99,235)' }}
                    />
                    잠금 해제 · ₩19,900 →
                  </button>
                </Link>
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
