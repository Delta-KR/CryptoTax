import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { formatKrw } from '@/lib/client/tax';

// 대시보드 상단 4-StatCard row.
// 순손익 / 기본공제 / 예상 납부세액 (masked = paywall) / 통합 거래수.
// masked 시 "예상 납부세액" 만 blur + 결제 CTA. 다른 stat 는 그대로.
export function DashboardStatCards({
  netPnL,
  totalGain,
  totalLoss,
  deduction,
  tax,
  masked,
  transactionCount,
  exchangeCount,
}: {
  netPnL: number;
  totalGain: number;
  totalLoss: number;
  deduction: number;
  tax: number;
  masked: boolean;
  transactionCount: number;
  exchangeCount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="순손익"
        value={formatKrw(netPnL)}
        tone={netPnL >= 0 ? 'good' : 'bad'}
        sub={`총 양도차익 ${formatKrw(totalGain)} − 손실 ${formatKrw(totalLoss)}`}
      />
      <StatCard
        label="기본공제"
        value={`−${formatKrw(deduction).replace('+', '').replace('−', '')}`}
        sub="연 1회 자동 적용"
      />
      {masked ? (
        <Link href="/billing" className="group relative block">
          <div className="pointer-events-none select-none blur-[10px]" aria-hidden>
            <StatCard
              label="예상 납부세액"
              value={formatKrw(tax)}
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
          value={formatKrw(tax)}
          tone="brand"
          sub={`과세표준 × 22% (소득세 20% + 지방세 2%)`}
        />
      )}
      <StatCard
        label="통합 거래수"
        value={`${transactionCount}건`}
        sub={`${exchangeCount}개 거래소`}
      />
    </div>
  );
}
