'use client';
import { useState } from 'react';
import Link from 'next/link';
import { HoverCard } from '@/components/ui/HoverCard';
import { SectionEyebrow } from '@/components/ui/section-heading';

interface Tier {
  name: string;
  tag: string;
  price: string;
  sub: string;
  saving?: string;
  features: readonly string[];
  cta: string;
  href: string;
  emphasis: boolean;
}

function makeTiers(annual: boolean): readonly Tier[] {
  return [
    {
      name: '무료',
      tag: '체험용',
      price: '₩0',
      sub: '영구 무료',
      features: [
        '1개 거래소 연동',
        '연 100건 거래까지',
        '기본 세금 계산',
        'PDF 리포트 1회',
      ],
      cta: '무료로 시작',
      href: '/signup',
      emphasis: false,
    },
    {
      name: '프리미엄',
      tag: '대부분의 투자자',
      price: annual ? '₩19,900' : '₩4,900',
      sub: annual ? '/ 년 (월 ₩1,650)' : '/ 월',
      saving: annual ? '연간 결제 시 66% 할인' : undefined,
      features: [
        '모든 거래소 무제한',
        '거래 무제한',
        '선입선출 / 이동평균법',
        '의제취득가액 자동',
        '세무사 전달용 PDF',
        '이메일 우선 지원',
      ],
      cta: '프리미엄 시작',
      href: annual ? '/signup?tier=premium&billing=annual' : '/signup?tier=premium&billing=monthly',
      emphasis: true,
    },
    {
      name: '원타임',
      tag: '5월 신고 시즌',
      price: '₩29,900',
      sub: '신고 시즌 1회',
      features: [
        '프리미엄 기능 전체',
        '5월 ~ 6월 30일간',
        '단 한 번의 정산',
        '구독 부담 없음',
      ],
      cta: '신고 시즌 구매',
      href: '/checkout?tier=onetime',
      emphasis: false,
    },
  ];
}

function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (a: boolean) => void;
}) {
  const options: ReadonlyArray<readonly [boolean, string]> = [
    [false, '월간'],
    [true, '연간'],
  ];
  return (
    <div
      role="group"
      aria-label="결제 주기 선택"
      className="inline-flex gap-1 rounded-full border border-line bg-card p-1"
    >
      {options.map(([k, lbl]) => {
        const active = annual === k;
        return (
          <button
            key={lbl}
            type="button"
            onClick={() => onChange(k)}
            aria-pressed={active}
            className={
              'rounded-full px-[18px] py-2 text-[13px] font-semibold transition-colors ' +
              (active
                ? 'bg-ink text-white dark:bg-brand'
                : 'bg-transparent text-muted hover:text-ink-2')
            }
          >
            {lbl}
            {k === true && (
              <span
                className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ color: '#10B981', background: 'rgba(16,185,129,0.15)' }}
              >
                −66%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

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
        'rounded-[18px] border p-8 ' +
        (e ? '' : 'border-line bg-card shadow-sm') +
        (e ? ' lg:-translate-y-3' : '')
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
      {e && (
        <div
          className="absolute left-1/2 -top-3.5 -translate-x-1/2 nowrap rounded-full bg-brand px-3.5 py-[5px] text-[11px] font-bold tracking-[0.06em] text-white"
          style={{ boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}
        >
          BEST VALUE
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
        <h3 className="text-[24px] font-extrabold tracking-tightish">{tier.name}</h3>
      </div>

      <div
        className={
          'mb-6 border-b pb-6 ' + (e ? 'border-white/[0.12]' : 'border-line-2')
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
        {tier.saving && (
          <div
            className={'mt-1.5 text-xs font-semibold ' + (e ? '' : 'text-good')}
            style={e ? { color: '#6EE7B7' } : undefined}
          >
            ✓ {tier.saving}
          </div>
        )}
      </div>

      <ul className="mb-7 flex list-none flex-col gap-3">
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
  const [annual, setAnnual] = useState(true);
  const tiers = makeTiers(annual);

  return (
    <section id="pricing" className="section-pad">
      <div className="mx-auto max-w-content">
        <div className="mb-10 text-center">
          <SectionEyebrow>PRICING</SectionEyebrow>
          <h2 className="mb-4 text-[32px] font-extrabold leading-[1.15] tracking-tighter3 text-ink lg:text-[44px]">
            합리적인 요금제
          </h2>
          <p className="mx-auto max-w-[580px] text-[17px] leading-[1.6] text-muted">
            세금 한 번 신고하는 데 들이는 시간을 생각하면, 커피 4잔 값.
          </p>
        </div>

        <div className="mb-10 flex justify-center">
          <BillingToggle annual={annual} onChange={setAnnual} />
        </div>

        <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-4 lg:grid-cols-3">
          {tiers.map((t) => (
            <PricingCard key={t.name} tier={t} />
          ))}
        </div>

        <p className="mt-8 text-center text-[12.5px] text-muted-2">
          모든 요금제 14일 무료 체험 · 언제든 해지 가능 · 환불 보장
        </p>
      </div>
    </section>
  );
}
