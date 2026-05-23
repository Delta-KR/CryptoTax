'use client';
import Link from 'next/link';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { HoverCard } from '@/components/ui/HoverCard';
import { plans, type PlanId } from '@/lib/mock/billing';
import { useCurrentUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const current: PlanId = user?.plan ?? 'free';

  return (
    <>
      <PageHeader
        title="구독 및 결제"
        description="한 해만 신고하면 단일 과세연도, 여러 해를 정리하면 구독을 선택하세요."
        right={
          <Pill tone="brand" size="md">
            현재 {plans.find((p) => p.id === current)?.name}
          </Pill>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === current;
          const isEmphasis = plan.id === 'premium';
          return (
            <HoverCard
              key={plan.id}
              className={cn(
                'relative rounded-[18px] border p-7',
                isEmphasis
                  ? 'lg:-translate-y-2'
                  : 'border-line bg-card shadow-sm'
              )}
              style={
                isEmphasis
                  ? {
                      // DESIGN.md §8: 다크 그라디언트 카드 (#1E3A8A → #0F1B3D) 안티패턴.
                      // 단일 brand 색 + brand-glow 로 통일.
                      background: 'rgb(var(--brand))',
                      borderColor: 'rgb(var(--brand))',
                      color: '#fff',
                      boxShadow: '0 24px 48px -12px rgba(37,99,235,0.40)',
                    }
                  : undefined
              }
            >
              {isEmphasis && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 nowrap rounded-full bg-brand px-3 py-1 text-[10px] font-bold tracking-[0.06em] text-white"
                  style={{ boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}
                >
                  BEST VALUE
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-[20px] font-extrabold tracking-tightish">
                  {plan.name}
                </h3>
                {isCurrent && (
                  <Pill tone={isEmphasis ? 'brand' : 'good'} size="sm">
                    현재 플랜
                  </Pill>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="num text-[32px] font-extrabold leading-none tracking-tighter3">
                  {plan.price}
                </span>
                <span
                  className={cn(
                    'text-[12px]',
                    isEmphasis ? 'text-white/70' : 'text-muted'
                  )}
                >
                  {plan.billing}
                </span>
              </div>

              <ul className="mt-5 flex list-none flex-col gap-2.5 text-[13px]">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="8"
                        fill={isEmphasis ? 'rgba(255,255,255,0.15)' : 'rgb(var(--brand-soft))'}
                      />
                      <path
                        d="M5 8L7 10L11 6"
                        stroke={isEmphasis ? '#fff' : 'rgb(var(--brand))'}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className={isEmphasis ? 'text-white/[0.92]' : 'text-ink-2'}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled
                    className={isEmphasis ? 'opacity-50' : ''}
                  >
                    사용 중
                  </Button>
                ) : (
                  <Link href={`/billing/checkout?plan=${plan.id}`}>
                    <Button
                      fullWidth
                      variant={isEmphasis ? 'secondary' : 'primary'}
                      className={
                        isEmphasis
                          ? 'border-transparent bg-white text-brand hover:bg-white/90'
                          : ''
                      }
                    >
                      {plan.id === 'free'
                        ? '다운그레이드'
                        : plan.id === 'premium'
                          ? '구독 시작'
                          : '구매'}
                    </Button>
                  </Link>
                )}
              </div>
            </HoverCard>
          );
        })}
      </div>

      {/* Sub navigation cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/billing/history">
          <HoverCard className="flex items-center justify-between rounded-lg border border-line bg-card p-5 shadow-sm">
            <div>
              <div className="text-[15px] font-bold text-ink">결제 내역</div>
              <div className="mt-1 text-[12px] text-muted">과거 결제 / 영수증 확인</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="rgb(var(--muted))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </HoverCard>
        </Link>
        <Link href="/billing/tax-pro">
          <HoverCard className="flex items-center justify-between rounded-lg border border-line bg-card p-5 shadow-sm">
            <div>
              <div className="text-[15px] font-bold text-ink">세무사 매칭</div>
              <div className="mt-1 text-[12px] text-muted">제휴 세무사 연결 신청</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="rgb(var(--muted))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </HoverCard>
        </Link>
      </div>
    </>
  );
}
