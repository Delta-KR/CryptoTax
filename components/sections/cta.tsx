import Link from 'next/link';
import { getDaysUntilTaxStart } from '@/lib/dday';

// Final CTA — restrained: solid surface, no glow blobs, no glass, no grid.
// Trust > spectacle for a Korean fintech audience.

function DBadge() {
  const dday = getDaysUntilTaxStart();
  return (
    <div className="nowrap mb-6 inline-flex items-center gap-2 rounded-full border border-brand/[0.22] bg-brand-soft px-3.5 py-1.5 text-xs font-semibold tracking-[0.02em] text-brand-2">
      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
      첫 신고까지 D-{dday}
    </div>
  );
}

function Stat2({
  num,
  label,
  sub,
  border,
}: {
  num: string;
  label: string;
  sub?: string;
  border?: boolean;
}) {
  return (
    <div
      className={
        'px-6 text-center ' +
        (border ? 'lg:border-x lg:border-line' : '')
      }
    >
      <div className="num text-[32px] font-extrabold tracking-tighter2 text-ink">
        {num}
      </div>
      <div className="nowrap mt-1 text-[13px] font-medium text-muted">{label}</div>
      {sub && (
        <div className="nowrap mt-0.5 text-[11px] text-muted-2">{sub}</div>
      )}
    </div>
  );
}

export function CTA() {
  return (
    <section className="section-pad">
      <div className="mx-auto max-w-[880px] rounded-2xl border border-line bg-card px-6 py-12 text-center sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <DBadge />

        <h2 className="mb-5 text-[36px] font-extrabold leading-[1.12] tracking-tightest text-ink lg:text-[52px]">
          지금 무료로
          <br />
          <span className="text-brand">시작해 보세요.</span>
        </h2>
        <p className="mx-auto mb-9 max-w-[520px] text-[17px] leading-[1.6] text-muted">
          신용카드 없어도 1분이면 끝나요. 결과 먼저 보고 결정해도 돼요.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-7 py-[15px] text-[15px] font-bold tracking-[-0.005em] text-white transition-colors hover:bg-brand-2"
          >
            무료로 시작하기
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h10m0 0L9 4m4 4L9 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a
            href="#pricing"
            className="rounded-[10px] border border-line bg-card px-6 py-3.5 text-[15px] font-medium tracking-[-0.005em] text-ink-2 transition-colors hover:bg-bg-soft"
          >
            요금제 비교
          </a>
        </div>

        {/* Stats strip — 출처:
            · 1,550만 = 5대 거래소 투자자 합산 1,559만 (중복 포함). docs/business-plan.md §3, 2024.11 기준
            · TAM (중복 제거 보유자)은 1,150~1,250만 — 별도 지표
            · 20% / 2% = 소득세법 §64의3② (지방세는 별도 신고) */}
        <div className="mt-14 grid grid-cols-1 gap-4 border-t border-line pt-8 lg:grid-cols-3 lg:gap-0">
          <Stat2 num="1,550만" label="한국 가상자산 투자자" />
          <Stat2
            num="20%"
            label="양도소득세율"
            sub="지방세 2%는 따로 신고"
            border
          />
          <Stat2 num="250만원" label="기본공제" sub="연 1회 자동 적용" />
        </div>
      </div>
    </section>
  );
}
