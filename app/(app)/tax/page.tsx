'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useCurrentUser } from '@/lib/auth';
import { calculateTaxFromFiles } from '@/app/actions/calculate';
import { loadSession, replaceCalculation } from '@/lib/storage/session';
import { getTransactions, type Transaction } from '@/lib/mock/transactions';
import {
  calculateTax,
  formatKrw,
  getTaxMethod,
  type ExchangeCoinPnL,
  type HoldingsByCoinClient,
  type RealizedGainClient,
  type TaxMethod,
} from '@/lib/mock/tax';
import { toKSTDateStr } from '@/lib/engine/exchange-rate';

const TAX_METHOD_LABEL: Record<TaxMethod, string> = {
  totalAverage: '총평균법 (시행령 §88①)',
  fifo: '선입선출법',
  avg: '이동평균법',
};

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
    // DESIGN.md §7/§8: brand→purple 그라디언트 안티패턴 제거. 단일 brand 색 + brand-glow.
    <div
      className="mb-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-[14px] bg-brand px-7 py-6 shadow-brand-glow sm:flex-row sm:items-center"
    >
      <div className="min-w-0 text-white">
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] backdrop-blur-sm">
          Premium Only
        </div>
        <div className="text-[18px] font-extrabold leading-[1.3] tracking-[-0.01em]">
          정확한 납부세액 + 코인별 손익 + PDF 리포트
        </div>
        <p className="mt-1 text-[13px] leading-[1.5] text-white/85">
          단일 과세연도 ₩49,900 — 결제 후 즉시 전체 결과를 확인할 수 있어요.
        </p>
      </div>
      <Link href="/billing" className="flex-shrink-0">
        <button
          type="button"
          className="group relative whitespace-nowrap rounded-md bg-white px-5 py-3 text-[14px] font-extrabold text-brand shadow-md transition-colors hover:bg-bg-soft"
        >
          <span className="absolute inset-0 -z-10 animate-pulse rounded-md bg-white/60 blur-md" />
          유료 플랜 보기 →
        </button>
      </Link>
    </div>
  );
}

// P1 #10: 이월 보유 자산 — 신고 연도 종료 시점 잔여 lots.
function HoldingsAfterTable({
  holdings,
}: {
  holdings: HoldingsByCoinClient[];
}) {
  if (holdings.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-[13px] text-muted">
        해당 연도 종료 시점 보유 자산이 없습니다.
      </p>
    );
  }
  return (
    <Table className="border-t border-line-2">
      <TableHead>
        <TableRow>
          <TableHeaderCell>코인</TableHeaderCell>
          <TableHeaderCell>매수일</TableHeaderCell>
          <TableHeaderCell>거래소</TableHeaderCell>
          <TableHeaderCell className="text-right">잔량 / 원수량</TableHeaderCell>
          <TableHeaderCell className="text-right">단가</TableHeaderCell>
          <TableHeaderCell className="text-right">취득가액</TableHeaderCell>
          <TableHeaderCell></TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {holdings.flatMap((h, hi) =>
          h.lots.map((lot, li) => {
            const ratio = lot.originalAmount > 0
              ? (lot.amount / lot.originalAmount) * 100
              : 100;
            return (
              <TableRow
                key={`${h.coin}|${lot.id}`}
                className={
                  li === 0 && hi > 0 ? 'border-t-2 border-line' : ''
                }
              >
                <TableCell>
                  {li === 0 ? (
                    <div>
                      <div className="inline-flex items-center gap-2">
                        <CoinIcon coin={h.coin} size={20} />
                        <span className="text-[12.5px] font-bold text-ink">
                          {h.coin}
                        </span>
                      </div>
                      <div className="num mt-0.5 text-[10.5px] text-muted-2">
                        총 {h.totalAmount.toLocaleString('ko-KR', {
                          maximumFractionDigits: 6,
                        })}{' '}
                        · 평균 ₩
                        {Math.round(h.avgCostKRW).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  ) : (
                    ''
                  )}
                </TableCell>
                <TableCell className="num text-[11.5px] text-muted">
                  {formatShortDate(lot.date)}
                </TableCell>
                <TableCell className="text-[11.5px] text-muted">
                  {lot.exchange}
                </TableCell>
                <TableCell className="num text-right text-[11.5px]">
                  <div>
                    {lot.amount.toLocaleString('ko-KR', {
                      maximumFractionDigits: 8,
                    })}
                  </div>
                  <div className="text-[10px] text-muted-2">
                    / {lot.originalAmount.toLocaleString('ko-KR', {
                      maximumFractionDigits: 8,
                    })}{' '}
                    ({ratio.toFixed(0)}%)
                  </div>
                </TableCell>
                <TableCell className="num text-right text-[11.5px] text-muted">
                  ₩{Math.round(lot.pricePerUnitKRW).toLocaleString('ko-KR')}
                </TableCell>
                <TableCell className="num text-right text-[12px] font-semibold text-ink-2">
                  ₩{Math.round(lot.totalCostKRW).toLocaleString('ko-KR')}
                </TableCell>
                <TableCell>
                  {lot.isDeemedCost && (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full border border-warn/40 bg-warn-soft px-1.5 py-0.5 text-[9.5px] font-bold text-warn"
                      title="2026-12-31 의제취득가액 적용"
                    >
                      ⚖ 의제
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          }),
        )}
      </TableBody>
    </Table>
  );
}

// P1 #9: 거래소별 손익 매트릭스.
function ExchangeCoinMatrix({
  rows,
  masked,
}: {
  rows: ExchangeCoinPnL[];
  masked: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-[13px] text-muted">
        해당 연도 거래가 없습니다.
      </p>
    );
  }
  return (
    <Table className="border-t border-line-2">
      <TableHead>
        <TableRow>
          <TableHeaderCell>거래소</TableHeaderCell>
          <TableHeaderCell>코인</TableHeaderCell>
          <TableHeaderCell className="text-right">매수</TableHeaderCell>
          <TableHeaderCell className="text-right">매도</TableHeaderCell>
          <TableHeaderCell className="text-right">손익</TableHeaderCell>
          <TableHeaderCell className="text-right">거래수</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, i) => {
          const isFirst =
            i === 0 || rows[i - 1].exchange !== row.exchange;
          return (
            <TableRow
              key={`${row.exchange}|${row.coin}`}
              className={isFirst && i > 0 ? 'border-t-2 border-line' : ''}
            >
              <TableCell className="text-[12.5px] font-semibold text-ink-2">
                {isFirst ? row.exchange : ''}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <CoinIcon coin={row.coin} size={20} />
                  <span className="text-[12.5px] font-semibold">
                    {row.coin}
                  </span>
                </span>
              </TableCell>
              <TableCell className="num text-right text-[12px] text-muted">
                ₩{Math.round(row.buyKRW).toLocaleString('ko-KR')}
              </TableCell>
              <TableCell className="num text-right text-[12px] text-muted">
                ₩{Math.round(row.sellKRW).toLocaleString('ko-KR')}
              </TableCell>
              <TableCell
                className={
                  'num text-right text-[13px] font-bold ' +
                  (masked
                    ? 'text-muted-2'
                    : row.gain >= 0
                      ? 'text-good'
                      : 'text-bad')
                }
              >
                {masked ? '—' : formatKrw(row.gain)}
              </TableCell>
              <TableCell className="num text-right text-[12px] text-muted">
                {row.transactionCount}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function formatShortDate(iso: string): string {
  // KST 기준 — UTC 환경 분기 차이로 인한 표시 오류 방지.
  const kst = toKSTDateStr(new Date(iso)); // 'YYYY-MM-DD'
  return `${kst.slice(2, 4)}.${kst.slice(5, 7)}.${kst.slice(8, 10)}`;
}

function formatAmount(n: number): string {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: 8 });
}

function RealizedGainList({
  gains,
  method,
}: {
  gains: RealizedGainClient[];
  method: TaxMethod;
}) {
  if (gains.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-[13px] text-muted">
        해당 연도 매도 거래가 없습니다.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line-2">
      {gains.map((g) => (
        <li key={g.id}>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-3 transition-colors hover:bg-bg-soft">
              <svg
                className="size-3 flex-shrink-0 text-muted transition-transform group-open:rotate-90"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 2l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="num w-[78px] text-[12px] text-muted">
                {formatShortDate(g.sellDate)}
              </span>
              <CoinIcon coin={g.coin} size={20} />
              <span className="min-w-[50px] text-[13px] font-semibold text-ink">
                {g.coin}
              </span>
              <span className="hidden text-[11.5px] text-muted-2 sm:inline">
                {g.exchange}
              </span>
              <span className="num ml-auto hidden text-[12px] text-muted md:inline">
                {formatAmount(g.sellAmount)}
              </span>
              <span className="num w-[110px] text-right text-[12.5px] font-semibold text-ink-2">
                ₩{Math.round(g.proceedsKRW).toLocaleString('ko-KR')}
              </span>
              <span
                className={
                  'num w-[110px] text-right text-[13px] font-bold ' +
                  (g.pnlKRW >= 0 ? 'text-good' : 'text-bad')
                }
              >
                {formatKrw(g.pnlKRW)}
              </span>
            </summary>
            <div className="border-t border-line-2 bg-bg-soft px-6 py-4">
              <div className="mb-2 flex items-baseline justify-between">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-2">
                  사용된 매수 lot
                </div>
                <div className="num text-[11px] text-muted-2">
                  매도 ₩{Math.round(g.proceedsKRW).toLocaleString('ko-KR')} − 취득
                  ₩{Math.round(g.costBasisKRW).toLocaleString('ko-KR')} − 수수료
                  ₩{Math.round(g.sellFeeKRW + g.buyFeeKRW).toLocaleString('ko-KR')}
                </div>
              </div>
              {method === 'avg' ? (
                <div className="rounded-md border border-line bg-card px-4 py-3 text-[12px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-ink-2">
                      이동평균 (혼합 매수)
                    </span>
                    {g.consumedLots[0]?.isDeemedCost && (
                      <span
                        className="rounded-full border border-warn/40 bg-warn-soft px-2 py-0.5 text-[10px] font-bold text-warn"
                        title="underlying lots 중 의제취득가액 적용 lot 포함"
                      >
                        ⚖ 의제 포함
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-muted sm:grid-cols-4">
                    <div>
                      <div className="text-muted-2">사용 수량</div>
                      <div className="num font-semibold text-ink-2">
                        {formatAmount(g.consumedLots[0]?.amount ?? g.sellAmount)} {g.coin}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-2">평균 단가</div>
                      <div className="num font-semibold text-ink-2">
                        ₩
                        {Math.round(
                          g.consumedLots[0]?.pricePerUnitKRW ?? 0,
                        ).toLocaleString('ko-KR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-2">취득가액</div>
                      <div className="num font-semibold text-ink-2">
                        ₩
                        {Math.round(g.costBasisKRW).toLocaleString('ko-KR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-2">매수 정보</div>
                      <div className="text-[11px] text-muted">
                        다수 lot 평균
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Table className="rounded-md border border-line bg-card">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="!py-2">매수일</TableHeaderCell>
                      <TableHeaderCell className="!py-2">거래소</TableHeaderCell>
                      <TableHeaderCell className="!py-2 text-right">
                        사용 수량
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-2 text-right">
                        단가
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-2 text-right">
                        취득가액
                      </TableHeaderCell>
                      <TableHeaderCell className="!py-2">
                        <span className="sr-only">의제 여부</span>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {g.consumedLots.map((cl, i) => (
                      <TableRow key={cl.lotId + i}>
                        <TableCell className="num !py-2 text-[11.5px] text-muted">
                          {cl.buyDate ? formatShortDate(cl.buyDate) : '—'}
                        </TableCell>
                        <TableCell className="!py-2 text-[11.5px] text-muted">
                          {cl.exchange ?? '—'}
                        </TableCell>
                        <TableCell className="num !py-2 text-right text-[11.5px]">
                          {formatAmount(cl.amount)}
                        </TableCell>
                        <TableCell className="num !py-2 text-right text-[11.5px] text-muted">
                          ₩
                          {Math.round(cl.pricePerUnitKRW).toLocaleString(
                            'ko-KR',
                          )}
                        </TableCell>
                        <TableCell className="num !py-2 text-right text-[11.5px] font-semibold text-ink-2">
                          ₩
                          {Math.round(cl.costKRW).toLocaleString('ko-KR')}
                        </TableCell>
                        <TableCell className="!py-2">
                          {cl.isDeemedCost ? (
                            <span
                              className="inline-flex items-center gap-0.5 rounded-full border border-warn/40 bg-warn-soft px-1.5 py-0.5 text-[9.5px] font-bold text-warn"
                              title="2026-12-31 의제취득가액 적용"
                            >
                              ⚖ 의제
                            </span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

function BlurOverlay({
  children,
  masked,
  href = '/billing',
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
          className="rounded-full bg-brand px-3.5 py-1.5 text-[11.5px] font-extrabold text-white shadow-brand-glow transition-colors hover:bg-brand-2"
        >
          프리미엄 전용
        </div>
      </div>
    </Link>
  );
}

export default function TaxPage() {
  const toast = useToast();
  const { user } = useCurrentUser();
  const [year, setYear] = useState(2027);
  const [method, setMethod] = useState<TaxMethod>('totalAverage');
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recalcing, setRecalcing] = useState(false);
  // 자동 재계산은 free→premium 전환 직후 1회만 — 실패해도 다시 시도하지 않는다 (사용자가
  // 수동 버튼으로 재시도 가능).
  const autoRecalcTriedRef = useRef(false);

  useEffect(() => {
    setMethod(getTaxMethod());
    setTxs(getTransactions());
  }, []);

  const result = useMemo(
    () => calculateTax(txs, method, year),
    [txs, method, year, refreshKey]
  );

  // 자동 + 수동 재계산이 공유하는 핵심 흐름. in-flight guard 와 abort 시 stale 결과
  // 무시 처리까지 한 곳에서.
  const runRecalc = async (opts: { showToast: boolean }): Promise<void> => {
    if (recalcing) return;
    const session = loadSession();
    if (!session?.allParsed?.length) {
      if (opts.showToast) {
        setRefreshKey((k) => k + 1);
        toast.show('세금 계산이 재실행되었습니다.', 'success');
      }
      return;
    }
    setRecalcing(true);
    try {
      const formData = new FormData();
      formData.append('previousParsed', JSON.stringify(session.allParsed));
      formData.append('method', method);
      const res = await calculateTaxFromFiles(formData);
      if (res.ok) {
        replaceCalculation(res.payload);
        setTxs(getTransactions());
        setRefreshKey((k) => k + 1);
        if (opts.showToast) {
          toast.show('세금 계산이 재실행되었습니다.', 'success');
        }
      } else if (opts.showToast) {
        toast.show(res.error ?? '재계산에 실패했습니다.', 'error');
      }
    } catch (e) {
      if (opts.showToast) {
        toast.show(
          e instanceof Error ? e.message : '재계산에 실패했습니다.',
          'error',
        );
      }
    } finally {
      setRecalcing(false);
    }
  };

  useEffect(() => {
    if (autoRecalcTriedRef.current) return;
    if (!user || user.plan !== 'premium') return;
    if (!result.masked) return;
    autoRecalcTriedRef.current = true;
    void runRecalc({ showToast: false });
    // runRecalc 는 함수 참조 — deps 에 포함하면 매 렌더 마다 effect 가 재실행되므로 제외.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, result.masked]);

  const masked = result.masked;

  return (
    <>
      <PageHeader
        title="세금 계산"
        description={`${year}년 양도소득 · ${TAX_METHOD_LABEL[method]} 적용`}
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
              disabled={recalcing}
              onClick={() => {
                void runRecalc({ showToast: true });
              }}
            >
              {recalcing ? '재계산 중…' : '재계산'}
            </Button>
          </div>
        }
      />

      {masked && <PremiumBanner />}

      {/* 4 StatCards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="순손익"
          value={formatKrw(result.netPnL)}
          tone={result.netPnL >= 0 ? 'good' : 'bad'}
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
            sub="순손익 − 공제"
          />
        </BlurOverlay>
        <BlurOverlay masked={masked}>
          <StatCard
            label="납부세액"
            value={formatKrw(result.tax)}
            tone="brand"
            sub="과세표준 × 22% (소득세 20% + 지방세 2%)"
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
            sub="양수 손익만 합산"
          />
          <CalcRow
            label="총 양도손실"
            value={`−${formatKrw(result.totalLoss).replace('+', '').replace('−', '')}`}
            sub="음수 손익 절댓값"
          />
          <Divider />
          <CalcRow
            label="순손익"
            value={formatKrw(result.netPnL)}
            tone={result.netPnL >= 0 ? 'good' : undefined}
            bold
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
                href="/billing"
                className="group absolute inset-0 flex items-center justify-center"
              >
                <button
                  type="button"
                  className="relative whitespace-nowrap rounded-md bg-white px-5 py-2.5 text-[13px] font-extrabold text-brand shadow-md transition-colors hover:bg-bg-soft"
                >
                  <span className="absolute inset-0 -z-10 animate-pulse rounded-md bg-white/70 blur-lg" />
                  유료 플랜 보기 →
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
                  href="/billing"
                  className="group absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
                >
                  <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand shadow-md ring-1 ring-brand/30">
                    Premium Only
                  </div>
                  <div className="text-[14px] font-bold text-ink">
                    코인별 정확한 손익을 확인하세요
                  </div>
                  <button
                    type="button"
                    className="relative whitespace-nowrap rounded-md bg-brand px-6 py-3 text-[14px] font-extrabold text-white shadow-brand-glow transition-colors hover:bg-brand-2"
                  >
                    프리미엄 시작 →
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
                {method === 'totalAverage' ? '총평균법' : method === 'fifo' ? '선입선출법(FIFO)' : '이동평균법(MA)'}
              </Pill>
            </div>
          )}
        </Card>
      </div>

      {/* 거래소별 손익 (P1 #9) */}
      {result.perExchangeCoin.length > 0 && (
        <Card className="mt-6" padding="none">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-[16px] font-bold text-ink">
                거래소별 손익
              </h2>
              <p className="mt-0.5 text-[12px] text-muted">
                거래소 × 코인 매트릭스 — 세무사 전달 시 정렬에 유용 (손익은 매도 거래소 기준)
              </p>
            </div>
            <Pill tone="brand" size="sm">
              {new Set(result.perExchangeCoin.map((r) => r.exchange)).size}개 거래소
            </Pill>
          </div>
          {masked ? (
            <Link
              href="/billing"
              className="group relative block"
            >
              <div
                className="pointer-events-none select-none blur-[8px]"
                aria-hidden
              >
                <ExchangeCoinMatrix
                  rows={result.perExchangeCoin}
                  masked={true}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand shadow-md ring-1 ring-brand/30">
                  Premium Only
                </div>
                <div className="text-[14px] font-bold text-ink">
                  거래소별 정확한 손익을 확인하세요
                </div>
                <button
                  type="button"
                  className="relative whitespace-nowrap rounded-md bg-brand px-6 py-3 text-[14px] font-extrabold text-white shadow-brand-glow transition-colors hover:bg-brand-2"
                >
                  프리미엄 시작 →
                </button>
              </div>
            </Link>
          ) : (
            <ExchangeCoinMatrix
              rows={result.perExchangeCoin}
              masked={false}
            />
          )}
        </Card>
      )}

      {/* 매도-매수 매칭 (Audit Trail · P1 #6/#7) */}
      {result.realizedGains.length > 0 && (
        <Card className="mt-6" padding="none">
          <div className="flex items-center justify-between border-b border-line-2 px-6 py-4">
            <div>
              <h2 className="text-[16px] font-bold text-ink">
                매도-매수 매칭
              </h2>
              <p className="mt-0.5 text-[12px] text-muted">
                {method === 'totalAverage'
                  ? '각 매도에 적용된 연 단위 총평균 단가 (lot 추적 없음, 시행령 §92②4호)'
                  : method === 'fifo'
                  ? '각 매도가 어떤 매수 lot과 페어됐는지 (선입선출 순)'
                  : '각 매도에 적용된 평균 단가 · 의제취득가액 여부'}
              </p>
            </div>
            <Pill tone="brand" size="sm">
              {method === 'totalAverage' ? '총평균법' : method === 'fifo' ? 'FIFO' : 'MA'}
            </Pill>
          </div>
          {masked ? (
            <Link
              href="/billing"
              className="group relative block"
            >
              <div
                className="pointer-events-none select-none blur-[8px]"
                aria-hidden
              >
                <RealizedGainList gains={result.realizedGains.slice(0, 3)} method={method} />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand shadow-md ring-1 ring-brand/30">
                  Premium Only
                </div>
                <div className="text-[14px] font-bold text-ink">
                  매도별 매수 lot 매칭 audit trail
                </div>
                <button
                  type="button"
                  className="relative whitespace-nowrap rounded-md bg-brand px-6 py-3 text-[14px] font-extrabold text-white shadow-brand-glow transition-colors hover:bg-brand-2"
                >
                  프리미엄 시작 →
                </button>
              </div>
            </Link>
          ) : (
            <RealizedGainList
              gains={result.realizedGains}
              method={method}
            />
          )}
        </Card>
      )}

      {/* 이월 보유 자산 (P1 #10) — 다음 해 신고 시작점 */}
      {result.holdingsByCoin.length > 0 && (
        <Card className="mt-6" padding="none">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-[16px] font-bold text-ink">
                이월 보유 자산 ({year + 1}년 신고 시작점)
              </h2>
              <p className="mt-0.5 text-[12px] text-muted">
                {year}년 종료 시점 잔여 lots — 다음 해 매도 시 이 lot들이 우선 소비됩니다 (FIFO)
              </p>
            </div>
            <Pill tone="brand" size="sm">
              {result.holdingsByCoin.length}개 코인 ·{' '}
              {result.holdingsByCoin.reduce((s, h) => s + h.lots.length, 0)} lots
            </Pill>
          </div>
          <HoldingsAfterTable holdings={result.holdingsByCoin} />
          <div className="border-t border-line-2 bg-bg-soft px-6 py-3 text-[11.5px] text-muted">
            합산 취득가액 ₩
            {Math.round(
              result.holdingsByCoin.reduce(
                (s, h) => s + h.totalCostKRW,
                0,
              ),
            ).toLocaleString('ko-KR')}
            {' · '}
            매도 시점 시세는 별도 확인이 필요합니다 (취득가액 ≠ 시가)
          </div>
        </Card>
      )}

      {/* 환율·시세 출처 — 신뢰성 audit trail */}
      {result.rateSource && (
        <div
          className={
            'mt-5 rounded-lg border px-5 py-4 text-[12.5px] leading-[1.65] ' +
            (result.rateSource.fallbackUsed
              ? 'border-warn/40 bg-warn-soft'
              : 'border-line bg-card-2')
          }
        >
          <div className="mb-1 font-semibold text-ink-2">환율·시세 출처</div>
          <div className="text-muted">
            일별 시세: {result.rateSource.primary}
            {result.rateSource.lastFetchedAt && (
              <>
                {' '}· 마지막 갱신{' '}
                {new Date(
                  result.rateSource.lastFetchedAt,
                ).toLocaleDateString('ko-KR')}
              </>
            )}
          </div>
          {result.rateSource.fallbackUsed && (
            <div className="mt-1.5 text-warn">
              ⚠ 일부 거래에 정적 분기별 fallback 환율이 사용됐습니다. 정확한 신고를
              위해 시세 데이터 갱신 후 재계산을 권장합니다.
            </div>
          )}
        </div>
      )}

      {/* 의제취득가액 시가 출처 — pre-2027 매수가 있을 때만 */}
      {result.deemedCostSource &&
        (result.deemedCostSource.realCoins.length +
          result.deemedCostSource.estimateCoins.length +
          result.deemedCostSource.userOverrideCoins.length +
          result.deemedCostSource.missingCoins.length >
          0) && (
          <div
            className={
              'mt-3 rounded-lg border px-5 py-4 text-[12.5px] leading-[1.65] ' +
              (result.deemedCostSource.estimateCoins.length > 0 ||
              result.deemedCostSource.missingCoins.length > 0
                ? 'border-warn/40 bg-warn-soft'
                : 'border-line bg-card-2')
            }
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="font-semibold text-ink-2">
                의제취득가액 시가 ({result.deemedCostSource.deemedDate} 기준)
              </span>
              <Link
                href="/tax/deemed-cost"
                className="nowrap text-[11.5px] font-semibold text-brand hover:underline"
              >
                직접 입력 →
              </Link>
            </div>
            {result.deemedCostSource.realCoins.length > 0 && (
              <div className="text-muted">
                ✓ 실측 시가 적용:{' '}
                <span className="font-semibold text-good">
                  {result.deemedCostSource.realCoins.join(', ')}
                </span>
              </div>
            )}
            {result.deemedCostSource.userOverrideCoins.length > 0 && (
              <div className="mt-0.5 text-muted">
                ✓ 사용자 수동 입력:{' '}
                <span className="font-semibold text-ink-2">
                  {result.deemedCostSource.userOverrideCoins.join(', ')}
                </span>
              </div>
            )}
            {result.deemedCostSource.estimateCoins.length > 0 && (
              <div className="mt-1.5 text-warn">
                ⚠ 추정치 적용 (실시가 미확정):{' '}
                <span className="font-semibold">
                  {result.deemedCostSource.estimateCoins.join(', ')}
                </span>
                . {result.deemedCostSource.deemedDate} 종가 확정 후 재계산을 권장합니다.
              </div>
            )}
            {result.deemedCostSource.missingCoins.length > 0 && (
              <div className="mt-1.5 text-bad">
                ⚠ 시가 정보 없음 (실가로 처리됨, 의제 혜택 없음):{' '}
                <span className="font-semibold">
                  {result.deemedCostSource.missingCoins.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
    </>
  );
}
