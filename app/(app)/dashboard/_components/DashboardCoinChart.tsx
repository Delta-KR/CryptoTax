import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { BarChart } from '@/components/ui/Chart/BarChart';
import { formatKrw } from '@/lib/client/tax';

type ChartItem = { label: string; value: number; gain: boolean };

// 대시보드 코인별 손익 BarChart Card. masked = paywall blur + premium CTA.
// 빈 케이스에 "거래 없음" 안내.
export function DashboardCoinChart({
  chartItems,
  masked,
  year,
}: {
  chartItems: ChartItem[];
  masked: boolean;
  year: number;
}) {
  return (
    <Card className="mt-6" padding="md">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-ink">코인별 손익</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {year}년 양도차익 상위 5개
          </p>
        </div>
        <Pill tone="brand" size="sm">
          세율 22% (20% + 2%)
        </Pill>
      </div>
      {chartItems.length > 0 ? (
        masked ? (
          <Link href="/billing" className="group relative block">
            <div className="pointer-events-none select-none blur-[10px]" aria-hidden>
              <BarChart
                items={chartItems}
                formatter={(n) => formatKrw(n).replace('₩', '₩ ')}
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand shadow-md ring-1 ring-brand/30">
                Premium Only
              </div>
              <div className="text-[13px] font-bold text-ink">
                코인별 정확한 손익을 확인하세요
              </div>
              <button
                type="button"
                className="relative whitespace-nowrap rounded-md px-5 py-2.5 text-[13px] font-extrabold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.6)] transition-transform group-hover:scale-105"
                style={{
                  background:
                    'linear-gradient(135deg, rgb(var(--brand)) 0%, rgb(124,58,237) 100%)',
                }}
              >
                <span
                  className="absolute inset-0 -z-10 animate-pulse rounded-md blur-md"
                  style={{ background: 'rgb(37,99,235)' }}
                />
                유료 플랜 보기 →
              </button>
            </div>
          </Link>
        ) : (
          <BarChart
            items={chartItems}
            formatter={(n) => formatKrw(n).replace('₩', '₩ ')}
          />
        )
      ) : (
        <p className="py-6 text-center text-[13px] text-muted">
          {year}년 매도 거래가 없어요.
        </p>
      )}
    </Card>
  );
}
