import Link from 'next/link';
import { HoverCard } from '@/components/ui/HoverCard';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { getPlan, type PlanId } from '@/lib/pricing/plans';

// 랜딩 카드 메타 — 가격/이름/features 는 lib/pricing/plans.ts 단일 source 에서 가져옴.
// 여기엔 랜딩 전용 카피(tag/sub/description/cta/href/emphasis/badge)만.
//
// 구독(premium)은 2026-05-21 전략대로 MVP 출시 시점엔 아직 살 수 없음 (Phase 2: 2026.Q4 이후).
// 카드는 노출하되 "곧 출시" 배지 + 사전 알림 CTA. 가격(₩89K) anchoring 효과 유지.
interface TierMeta {
  planId: PlanId;
  tag: string;
  sub: string;
  description: string;
  cta: string;
  href: string;
  emphasis: boolean;
  badge?: string;
  comingSoon?: boolean;
}

const TIERS: readonly TierMeta[] = [
  {
    planId: 'free',
    tag: '체험·검증',
    sub: '영구 무료',
    description: '결제 전에 결과 미리 볼 수 있어요.',
    cta: '무료로 시작',
    href: '/signup?plan=free',
    emphasis: false,
  },
  {
    planId: 'premium',
    tag: '연중 절세 도구',
    sub: '/ 년 · 모든 과세연도',
    description:
      '여러 해를 한꺼번에 정리하거나 연중에 절세 기회를 잡고 싶은 분에게. 2026.Q4 출시 예정이에요.',
    cta: '출시 알림 받기',
    href: '/signup?plan=subscription',
    emphasis: true,
    badge: '2026.Q4 출시 예정',
    comingSoon: true,
  },
  {
    planId: 'onetime',
    tag: '한 해만 신고',
    sub: '1개 연도 · 영구 접근',
    description: '5월 신고 시즌에 한 번만 쓰는 분에게. 지금 결제할 수 있어요.',
    cta: '단일 연도 사전 등록',
    href: '/signup?plan=annual',
    emphasis: false,
  },
];

function FeatureCheck() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="8" fill="rgb(var(--brand-soft))" />
      <path
        d="M5 8L7 10L11 6"
        stroke="rgb(var(--brand))"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PricingCard({ tier }: { tier: TierMeta }) {
  const e = tier.emphasis;
  const plan = getPlan(tier.planId);
  return (
    <HoverCard
      className={
        'relative flex h-full flex-col rounded-[18px] border p-8 ' +
        (e
          ? 'border-brand bg-card shadow-sm ring-1 ring-brand/10'
          : 'border-line bg-card shadow-sm')
      }
    >
      {tier.badge && (
        <div className="absolute left-1/2 -top-3.5 -translate-x-1/2 nowrap rounded-full bg-brand px-3.5 py-[5px] text-[11px] font-bold tracking-[0.06em] text-white">
          {tier.badge}
        </div>
      )}

      <div className="mb-5">
        <div className={'mb-1 text-[11px] font-semibold tracking-[0.06em] ' + (e ? 'text-brand-2' : 'text-muted-2')}>
          {tier.tag.toUpperCase()}
        </div>
        <h3 className="text-[22px] font-extrabold tracking-tightish text-ink">{plan.name}</h3>
      </div>

      <div className="mb-5 border-b border-line-2 pb-5">
        <div className="flex items-baseline gap-1.5">
          <span className="num text-[40px] font-extrabold leading-none tracking-tighter3 text-ink">
            {plan.price}
          </span>
          <span className="text-[13px] text-muted">{tier.sub}</span>
        </div>
        <p className="mt-2.5 text-[12.5px] leading-[1.55] text-muted">{tier.description}</p>
      </div>

      <ul className="mb-7 flex flex-1 list-none flex-col gap-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm">
            <FeatureCheck />
            <span className="text-ink-2">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={tier.href}
        className={
          'block w-full rounded-[10px] px-[18px] py-3.5 text-center text-sm font-bold tracking-[-0.005em] transition-colors ' +
          (e
            ? 'bg-brand text-white hover:bg-brand-2'
            : 'border border-line bg-card text-ink hover:bg-bg-soft')
        }
      >
        {tier.cta}
      </Link>
    </HoverCard>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="section-pad">
      <div className="mx-auto max-w-content">
        <div className="mb-10 text-center">
          <SectionEyebrow>PRICING</SectionEyebrow>
          <h2 className="mb-4 text-[32px] font-extrabold leading-[1.15] tracking-tighter3 text-ink lg:text-[44px]">
            상황에 맞게 골라 보세요.
          </h2>
          <p className="mx-auto max-w-[640px] text-[17px] leading-[1.6] text-muted">
            5월 신고 시즌만 쓸 거면 <strong className="font-semibold text-ink">단일 연도</strong>.
            연중 절세 도구가 필요하면 <strong className="font-semibold text-ink">구독</strong>(2026.Q4 출시)이에요.
            둘 다 결제 전에 미리 결과 볼 수 있어요.
          </p>
          <div className="mx-auto mt-5 inline-flex max-w-[640px] items-center gap-2 rounded-full border border-warn/40 bg-warn-soft px-3.5 py-1.5 text-[12.5px] font-medium text-warn">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-warn" />
            유료 플랜은 곧 출시 — 지금 가입하면 무료 미리보기 + 출시 알림
          </div>
        </div>

        <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-stretch gap-4 md:grid-cols-3 lg:grid-cols-[1fr_1.18fr_1fr]">
          {TIERS.map((t) => (
            <PricingCard key={t.planId} tier={t} />
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-[760px] rounded-lg border border-line-2 bg-bg-soft px-5 py-4 text-center text-[13px] leading-[1.65] text-muted">
          <strong className="font-semibold text-ink-2">단일과 구독의 차이</strong>{' '}
          단일은 5월 신고 시즌 1회 결제용이에요. 구독은 PDF 무제한에 상시 손익 대시보드,
          절세 매도 알림 (Tax-Loss Harvesting), 거래소 API 자동 연동까지 포함된 연중 절세 도구예요
          (2026.Q4 출시 시 상세 안내).
        </div>

        <p className="mt-6 text-center text-[12.5px] text-muted-2">
          결제 전 환불 정책 안내 · 시스템 오류·중복결제 시 100% 환불
        </p>
      </div>
    </section>
  );
}
