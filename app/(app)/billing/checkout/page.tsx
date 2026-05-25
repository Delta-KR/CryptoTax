'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { plans, type PlanId } from '@/lib/pricing/plans';

export default function CheckoutPage() {
  const params = useSearchParams();
  const planParam = (params.get('plan') as PlanId) || 'premium';
  const plan = plans.find((p) => p.id === planParam) ?? plans[1];

  return (
    <>
      <PageHeader
        title="결제"
        description="결제 시스템 준비 중"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        {/* Plan summary (read-only) */}
        <Card padding="lg" className="h-fit">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
            선택한 플랜
          </div>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-tighter3 text-ink">
            {plan.name}
          </h2>
          <div className="mt-4 flex items-baseline gap-1.5 border-b border-line-2 pb-4">
            <span className="num text-[28px] font-extrabold tracking-tighter3 text-ink">
              {plan.price}
            </span>
            <span className="text-[13px] text-muted">{plan.billing}</span>
          </div>
          <ul className="mt-4 flex flex-col gap-2.5 text-[13px]">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 text-good">✓</span>
                <span className="text-ink-2">{f}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Not-ready notice */}
        <Card padding="lg">
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-soft text-muted">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-[18px] font-bold text-ink">
                결제 시스템 준비 중입니다
              </h2>
              <p className="max-w-[420px] text-[13px] leading-[1.65] text-muted">
                안전한 결제 처리를 위해 포트원(PortOne) 통합을 진행 중이에요.
                카카오페이·네이버페이·토스페이·신용카드를 모두 지원하며, 서비스 오픈 시
                등록하신 이메일로 안내드려요.
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <Link href="/billing">
                <Button variant="secondary">요금제 페이지로</Button>
              </Link>
              <Link href="/dashboard">
                <Button>대시보드로</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
