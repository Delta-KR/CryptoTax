'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { getTransactions, type Transaction } from '@/lib/mock/transactions';
import {
  calculateTax,
  formatKrw,
  getTaxMethod,
  type TaxMethod,
} from '@/lib/mock/tax';
import { useCurrentUser } from '@/lib/auth';
import { loadSession } from '@/lib/storage/session';

interface IncludeOpts {
  trades: boolean;
  basis: boolean;
  schedule: boolean;
  notes: boolean;
}

export default function ReportPage() {
  const toast = useToast();
  const { user, loading: userLoading } = useCurrentUser();
  const [year, setYear] = useState(2027);
  const [method, setMethod] = useState<TaxMethod>('fifo');
  const [include, setInclude] = useState<IncludeOpts>({
    trades: true,
    basis: true,
    schedule: true,
    notes: false,
  });
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setMethod(getTaxMethod());
    setTxs(getTransactions());
  }, []);

  const result = useMemo(
    () => calculateTax(txs, method, year),
    [txs, method, year],
  );

  const isFree = !userLoading && user?.plan !== 'premium';

  async function handleDownload() {
    setDownloading(true);
    try {
      const session = loadSession();
      if (!session?.result) {
        toast.show(
          '먼저 거래 데이터를 업로드해주세요.',
          'error',
        );
        setDownloading(false);
        return;
      }
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: session.result,
          transactions: session.allUnified,
          year: session.year,
          method: session.method,
        }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        toast.show(
          errBody?.error ?? `다운로드 실패 (${response.status})`,
          'error',
        );
        setDownloading(false);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kontaxt_${session.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.show('PDF 다운로드 완료', 'success');
    } catch (e) {
      toast.show(
        e instanceof Error ? e.message : '다운로드 실패',
        'error',
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="리포트"
        description="신고용 PDF 리포트를 생성합니다. 세무사 전달 또는 홈택스 직접 입력에 사용."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        {/* Options */}
        <Card padding="lg" className="flex flex-col gap-5">
          <div>
            <h2 className="mb-3 text-[14px] font-bold text-ink">리포트 옵션</h2>
            <div className="flex flex-col gap-4">
              <Select
                label="신고 연도"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                <option value={2027}>2027년</option>
                <option value={2026}>2026년</option>
              </Select>
              <Select
                label="계산 방식"
                value={method}
                onChange={(e) => setMethod(e.target.value as TaxMethod)}
              >
                <option value="fifo">선입선출법 (FIFO)</option>
                <option value="avg">이동평균법 (MA)</option>
              </Select>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-[13px] font-bold text-ink-2">포함 항목</h3>
            <div className="flex flex-col gap-3">
              <Checkbox
                checked={include.trades}
                onChange={(e) =>
                  setInclude((s) => ({ ...s, trades: e.target.checked }))
                }
                label="거래 원본 내역"
              />
              <Checkbox
                checked={include.basis}
                onChange={(e) =>
                  setInclude((s) => ({ ...s, basis: e.target.checked }))
                }
                label="취득가액 산출 근거"
              />
              <Checkbox
                checked={include.schedule}
                onChange={(e) =>
                  setInclude((s) => ({ ...s, schedule: e.target.checked }))
                }
                label="신고 일정 (5월)"
              />
              <Checkbox
                checked={include.notes}
                onChange={(e) =>
                  setInclude((s) => ({ ...s, notes: e.target.checked }))
                }
                label="세무사 메모란"
              />
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            {isFree ? (
              <Link href="/billing" className="group relative block">
                <div
                  className="pointer-events-none select-none blur-[6px]"
                  aria-hidden
                >
                  <Button fullWidth>PDF 다운로드</Button>
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-gradient-to-br from-brand/10 via-transparent to-brand/10 transition-colors group-hover:from-brand/25 group-hover:to-brand/25">
                  <div
                    className="rounded-full px-3.5 py-1.5 text-[11.5px] font-extrabold text-white shadow-[0_4px_14px_rgba(37,99,235,0.45)] transition-transform group-hover:scale-110"
                    style={{ background: 'rgb(var(--brand))' }}
                  >
                    프리미엄 전용
                  </div>
                </div>
              </Link>
            ) : (
              <Button
                fullWidth
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? 'PDF 생성 중…' : 'PDF 다운로드'}
              </Button>
            )}
            <Button
              variant="secondary"
              fullWidth
              onClick={() =>
                toast.show('세무사 전달용 링크가 복사되었습니다.', 'info')
              }
            >
              세무사 전달용 링크
            </Button>
          </div>
        </Card>

        {/* Preview (mock PDF) */}
        <div className="rounded-lg border border-line bg-bg-tint p-4 sm:p-8">
          <div className="mx-auto max-w-[640px] rounded-md border border-line bg-card p-8 shadow-md">
            <div className="flex items-start justify-between border-b border-line-2 pb-5">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-2">
                  Tax Report · 가상자산 양도소득
                </div>
                <h2 className="mt-1 text-[22px] font-extrabold tracking-tighter3 text-ink">
                  {year}년 귀속 양도소득세 신고서
                </h2>
                <p className="mt-1 text-[12px] text-muted">
                  발행: {new Date().toLocaleDateString('ko-KR')} · Kontaxt
                </p>
              </div>
              <Pill tone="brand" size="sm">
                {method === 'fifo' ? 'FIFO' : 'MA'}
              </Pill>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                  순손익
                </dt>
                <dd className={`num mt-1 text-[18px] font-bold ${result.netPnL >= 0 ? 'text-good' : 'text-bad'}`}>
                  {formatKrw(result.netPnL)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                  기본공제
                </dt>
                <dd className="num mt-1 text-[18px] font-bold text-ink">
                  −250만원
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                  과세표준
                </dt>
                <dd className="num mt-1 text-[18px] font-bold text-ink">
                  {formatKrw(result.taxable)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                  납부세액
                </dt>
                <dd className="num mt-1 text-[18px] font-bold text-brand">
                  {formatKrw(result.tax)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-line-2 pt-5">
              <h3 className="text-[13px] font-bold text-ink-2">코인별 손익</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {result.perCoin.slice(0, 5).map((c) => (
                  <li
                    key={c.coin}
                    className="flex items-center justify-between border-b border-line-2 pb-2 text-[13px] last:border-b-0 last:pb-0"
                  >
                    <span className="font-semibold text-ink">{c.coin}</span>
                    <span
                      className={
                        'num font-semibold ' +
                        (c.gain >= 0 ? 'text-good' : 'text-bad')
                      }
                    >
                      {formatKrw(c.gain)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {include.notes && (
              <div className="mt-6 border-t border-line-2 pt-5">
                <h3 className="text-[13px] font-bold text-ink-2">세무사 메모</h3>
                <div className="mt-3 h-24 rounded-sm border border-dashed border-line bg-bg-soft" />
              </div>
            )}

            <div className="mt-6 border-t border-line-2 pt-4 text-center text-[10px] text-muted-2">
              본 리포트는 세무 신고의 참고 자료를 제공하며, 최종 신고는 세무사 검토를 권장합니다.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
