import Link from 'next/link';
import { HoverCard } from '@/components/ui/HoverCard';
import { SectionEyebrow } from '@/components/ui/section-heading';

interface Tier {
  name: string;
  tag: string;
  price: string;
  sub: string;
  description: string;
  features: readonly string[];
  cta: string;
  href: string;
  emphasis: boolean;
  badge?: string;
}

const TIERS: readonly Tier[] = [
  {
    name: '무료',
    tag: '체험·검증',
    price: '₩0',
    sub: '영구 무료',
    description: '결제 전 결과를 미리 확인할 수 있습니다.',
    features: [
      '모든 거래소 파일 업로드',
      '총 양도차익 미리보기',
      '계산 흐름 / 거래 내역',
      '결제 전 결과 검증',
    ],
    cta: '무료로 시작',
    href: '/signup',
    emphasis: false,
  },
  {
    name: '구독',
    tag: '여러 해 신고',
    price: '₩19,900',
    sub: '/ 년 · 모든 과세연도',
    description: '여러 해를 한꺼번에 정리하거나 연중 예상 세액을 추적하는 분에게.',
    features: [
      '모든 과세연도(과거·현재·미래)',
      'PDF 리포트 무제한 생성',
      '해지 후에도 기존 PDF 영구 다운로드',
      '모든 거래소 무제한',
      '의제취득가액 자동 적용',
      '이메일 우선 지원',
    ],
    cta: '구독 시작',
    href: '/signup',
    emphasis: true,
    badge: 'BEST VALUE',
  },
  {
    name: '단일 과세연도',
    tag: '한 해만 신고',
    price: '₩29,900',
    sub: '1개 연도 · 영구 접근',
    description: '매년 5월 신고 시즌에 한 번만 쓰는 분에게.',
    features: [
      '선택한 1개 과세연도 결과 열람',
      '해당 연도 PDF 리포트 무제한',
      '모든 거래소 무제한',
      '의제취득가액 자동 적용',
      '코인별 손익 상세',
    ],
    cta: '단일 연도 구매',
    href: '/signup',
    emphasis: false,
  },
];

function FeatureCheck({ emphasis }: { emphasis: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="8"
        fill={emphasis ? 'rgba(255,255,255,0.15)' : 'rgb(var(--brand-soft))'}
      />
      <path
        d="M5 8L7 10L11 6"
        stroke={emphasis ? '#fff' : 'rgb(var(--brand))'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PricingCard({ tier }: { tier: Tier }) {
  const e = tier.emphasis;
  return (
    <HoverCard
      className={
        'relative flex h-full flex-col rounded-[18px] border p-8 ' +
        (e ? '' : 'border-line bg-card shadow-sm')
      }
      style={
        e
          ? {
              background: 'linear-gradient(165deg, #1E3A8A 0%, #0F1B3D 100%)',
              borderColor: '#1E3A8A',
              color: '#fff',
              boxShadow: '0 24px 48px -12px rgba(30,58,138,0.45)',
            }
          : undefined
      }
    >
      {tier.badge && (
        <div
          className="absolute left-1/2 -top-3.5 -translate-x-1/2 nowrap rounded-full bg-brand px-3.5 py-[5px] text-[11px] font-bold tracking-[0.06em] text-white"
          style={{ boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}
        >
          {tier.badge}
        </div>
      )}

      <div className="mb-5">
        <div
          className={
            'mb-1 text-[11px] font-semibold tracking-[0.06em] ' +
            (e ? 'text-white/60' : 'text-muted-2')
          }
        >
          {tier.tag.toUpperCase()}
        </div>
        <h3 className="text-[22px] font-extrabold tracking-tightish">{tier.name}</h3>
      </div>

      <div
        className={
          'mb-5 border-b pb-5 ' + (e ? 'border-white/[0.12]' : 'border-line-2')
        }
      >
        <div className="flex items-baseline gap-1.5">
          <span className="num text-[40px] font-extrabold leading-none tracking-tighter3">
            {tier.price}
          </span>
          <span className={'text-[13px] ' + (e ? 'text-white/70' : 'text-muted')}>
            {tier.sub}
          </span>
        </div>
        <p
          className={
            'mt-2.5 text-[12.5px] leading-[1.55] ' +
            (e ? 'text-white/75' : 'text-muted')
          }
        >
          {tier.description}
        </p>
      </div>

      <ul className="mb-7 flex flex-1 list-none flex-col gap-3">
        {tier.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm">
            <FeatureCheck emphasis={e} />
            <span className={e ? 'text-white/[0.92]' : 'text-ink-2'}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={tier.href}
        className={
          'block w-full rounded-[10px] px-[18px] py-3.5 text-center text-sm font-bold tracking-[-0.005em] ' +
          (e
            ? 'bg-white'
            : 'bg-card text-ink shadow-[inset_0_0_0_1px_rgb(var(--line))]')
        }
        style={
          e
            ? { color: '#1E3A8A', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
            : undefined
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
            상황에 맞게 한 번만 선택하세요
          </h2>
          <p className="mx-auto max-w-[640px] text-[17px] leading-[1.6] text-muted">
            한 해만 신고하면 <strong className="font-semibold text-ink">단일 과세연도</strong>,
            여러 해를 정리하면 <strong className="font-semibold text-ink">구독</strong>.
            모두 결제 전에 무료로 결과를 미리 확인할 수 있어요.
          </p>
        </div>

        <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-4 lg:grid-cols-3">
          {TIERS.map((t) => (
            <PricingCard key={t.name} tier={t} />
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-[760px] rounded-lg border border-line-2 bg-bg-soft px-5 py-4 text-center text-[13px] leading-[1.65] text-muted">
          <strong className="font-semibold text-ink-2">왜 두 가지 상품으로 나눴나요?</strong>{' '}
          과세연도 2개만 결제해도 단일 상품은 ₩59,800인데 구독은 ₩19,900입니다.
          여러 해를 다룰 거면 구독이, 한 해만 정리할 거면 단일 연도가 자연스럽게 유리합니다.
        </div>

        <p className="mt-6 text-center text-[12.5px] text-muted-2">
          결제 전 환불 정책 안내 · 시스템 오류·중복결제 시 100% 환불
        </p>
      </div>
    </section>
  );
}
