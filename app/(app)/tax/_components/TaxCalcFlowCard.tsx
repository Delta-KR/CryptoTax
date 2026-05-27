import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatKrw, type TaxResult } from '@/lib/client/tax';
import { CalcRow, Divider } from './CalcRow';

// /tax 페이지 좌측 컬럼 — 계산 흐름 (총 양도차익 / 손실 / 순손익 / 공제 /
// 과세표준 / 세율 / 납부세액). masked (free user) 시 과세표준·납부세액
// blur + 결제 CTA.
export function TaxCalcFlowCard({
  result,
  year,
  masked,
}: {
  result: TaxResult;
  year: number;
  masked: boolean;
}) {
  return (
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
  );
}
