import { Fragment, type ReactNode } from 'react';
import { HoverCard } from '@/components/ui/HoverCard';
import { SectionEyebrow } from '@/components/ui/section-heading';

interface Step {
  n: number;
  title: string;
  desc: string;
  icon: ReactNode;
}

const steps: readonly Step[] = [
  {
    n: 1,
    title: '거래내역 업로드',
    desc: '거래소에서 다운받은 PDF · XLS · CSV 파일을 그대로 끌어다 놓으세요. 파일 형식은 자동 인식됩니다.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 16V4M12 4l-4 4M12 4l4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    n: 2,
    title: '한국 세법 기준 자동 계산',
    desc: '총평균법 (시행령 §88①) 자동 적용, 의제취득가액 자동 비교, 코인 간 교환 처리, 환율 변환까지 한 번에.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path
          d="M8 8h8M8 12h8M8 16h5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    n: 3,
    title: 'PDF 리포트 다운로드',
    desc: '종합소득세 신고 항목별로 정리된 리포트. 세무사에게 그대로 전달하거나 홈택스에 직접 입력하세요.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path
          d="M9 14l3 3 3-3M12 11v6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function StepCard({ step }: { step: Step }) {
  return (
    <HoverCard className="relative flex flex-col rounded-[18px] border border-line bg-card px-7 pb-8 pt-9 shadow-sm">
      {/* Big background numeral — primary ordering cue */}
      <div
        className="num pointer-events-none absolute right-6 top-[18px] text-[64px] font-extrabold leading-none tracking-[-0.04em] text-bg-tint"
        aria-hidden="true"
      >
        0{step.n}
      </div>

      {/* STEP pill */}
      <div className="nowrap mb-[22px] inline-flex items-center gap-1.5 self-start rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-brand-2">
        <span className="num">STEP 0{step.n}</span>
      </div>

      {/* Icon tile */}
      <div className="mb-[18px] flex h-12 w-12 items-center justify-center rounded-md bg-brand-soft text-brand">
        {step.icon}
      </div>

      <h3 className="mb-2.5 text-[20px] font-bold tracking-[-0.015em] text-ink">
        {step.title}
      </h3>
      <p className="text-sm leading-[1.7] text-muted">{step.desc}</p>
    </HoverCard>
  );
}

function StepArrow() {
  return (
    <div
      aria-hidden="true"
      className="hidden w-14 items-center justify-center text-muted-2 lg:flex"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 12h12m0 0l-5-5m5 5l-5 5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="section-pad">
      <div className="mx-auto max-w-content">
        {/* Centered heading block */}
        <div className="mb-[72px] text-center">
          <SectionEyebrow>HOW IT WORKS</SectionEyebrow>
          <h2 className="mb-4 text-[32px] font-extrabold leading-[1.15] tracking-tighter3 text-ink lg:text-[44px]">
            단 3단계, <span className="text-brand">약 2분</span>이면 끝납니다
          </h2>
          <p className="mx-auto max-w-[540px] text-[17px] leading-[1.6] text-muted">
            복잡한 계산은 Kontaxt가 대신 합니다. 당신은 파일만 올리세요.
          </p>
        </div>

        {/* Steps grid: 1fr auto 1fr auto 1fr on lg, stacked below */}
        <div className="grid items-stretch gap-y-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:gap-0">
          {steps.map((s, i) => (
            <Fragment key={s.n}>
              <StepCard step={s} />
              {i < steps.length - 1 && <StepArrow />}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
