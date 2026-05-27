'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { useUserContext } from '@/components/app-chrome/UserContextProvider';
import { calculateTaxFromFiles } from '@/app/actions/calculate';
import { loadSession, replaceCalculation } from '@/lib/storage/session';
import { getTransactions, type Transaction } from '@/lib/client/transactions';
import {
  calculateTax,
  getTaxMethod,
  type TaxMethod,
} from '@/lib/client/tax';
import { PremiumBanner } from './_components/PremiumBanner';
import { HoldingsAfterTable } from './_components/HoldingsAfterTable';
import { ExchangeCoinMatrix } from './_components/ExchangeCoinMatrix';
import { RealizedGainList } from './_components/RealizedGainList';
import { TaxStatsRow } from './_components/TaxStatsRow';

const TAX_METHOD_LABEL: Record<TaxMethod, string> = {
  totalAverage: '총평균법 (시행령 §88①)',
  fifo: '선입선출법',
  avg: '이동평균법',
};
import { TaxCalcFlowCard } from './_components/TaxCalcFlowCard';
import { TaxPerCoinCard } from './_components/TaxPerCoinCard';
export default function TaxPage() {
  const toast = useToast();
  const { user } = useUserContext();
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
        toast.show('세금 계산이 재실행됐어요.', 'success');
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
          toast.show('세금 계산이 재실행됐어요.', 'success');
        }
      } else if (opts.showToast) {
        toast.show(res.error ?? '재계산에 실패했어요.', 'error');
      }
    } catch (e) {
      if (opts.showToast) {
        toast.show(
          e instanceof Error ? e.message : '재계산에 실패했어요.',
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

      <TaxStatsRow result={result} masked={masked} />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <TaxCalcFlowCard result={result} year={year} masked={masked} />
        <TaxPerCoinCard
          result={result}
          year={year}
          method={method}
          masked={masked}
        />
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
                {method === 'totalAverage'
                  ? `${year}년 종료 시점 잔여 보유분 — 다음 해 총평균 단가의 기초 보유분으로 이월됩니다 (시행령 §92②4호)`
                  : method === 'fifo'
                  ? `${year}년 종료 시점 잔여 lots — 다음 해 매도 시 이 lot들이 우선 소비됩니다 (FIFO)`
                  : `${year}년 종료 시점 잔여 lots — 다음 해 매도 시 이 lot들의 평균 단가가 기준이 됩니다 (이동평균)`}
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
              ⚠ 일부 거래에 정적 분기별 fallback 환율이 사용됐어요. 정확한 신고를
              위해 시세 데이터 갱신 후 재계산을 권해 드려요.
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
                . {result.deemedCostSource.deemedDate} 종가 확정 후 재계산을 권해 드려요.
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
