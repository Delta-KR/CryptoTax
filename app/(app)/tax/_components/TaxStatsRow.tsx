import { StatCard } from '@/components/ui/StatCard';
import { formatKrw, type TaxResult } from '@/lib/client/tax';
import { BlurOverlay } from './BlurOverlay';

// /tax 페이지 결과 상단 4-StatCard row. masked (free user) 케이스 위 2개 stat
// (과세표준 / 납부세액) 만 BlurOverlay 로 paywall.
export function TaxStatsRow({
  result,
  masked,
}: {
  result: TaxResult;
  masked: boolean;
}) {
  return (
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
  );
}
