import Link from 'next/link';

// Final CTA — glass card on vivid 3-blob glow with a notebook grid overlay.
// Static RSC, no hover interactions.

function GlowBlobs() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-0"
        style={{
          top: '10%',
          left: '15%',
          width: 520,
          height: 520,
          background:
            'radial-gradient(closest-side, color-mix(in srgb, rgb(var(--brand)) 55%, transparent), transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-0"
        style={{
          bottom: '5%',
          right: '12%',
          width: 480,
          height: 480,
          background:
            'radial-gradient(closest-side, color-mix(in srgb, #8B5CF6 50%, transparent), transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-0"
        style={{
          top: '40%',
          left: '50%',
          width: 380,
          height: 380,
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(closest-side, color-mix(in srgb, #06B6D4 40%, transparent), transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
    </>
  );
}

function NotebookGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage:
          'linear-gradient(color-mix(in srgb, rgb(var(--brand)) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, rgb(var(--brand)) 22%, transparent) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)',
        opacity: 0.55,
      }}
    />
  );
}

function DBadge() {
  return (
    <div className="nowrap mb-6 inline-flex items-center gap-2 rounded-full border border-brand/[0.28] bg-brand/[0.14] px-3.5 py-1.5 text-xs font-semibold tracking-[0.02em] text-brand">
      <span
        className="h-1.5 w-1.5 rounded-full bg-brand"
        style={{ boxShadow: '0 0 0 4px rgba(37,99,235,0.25)' }}
      />
      첫 신고까지 D-237
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
        (border ? 'lg:border-x lg:border-ink/10' : '')
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
    <section className="section-pad relative overflow-hidden">
      <GlowBlobs />
      <NotebookGrid />

      {/* Glass card */}
      <div
        className="relative z-10 mx-auto max-w-[880px] rounded-2xl px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-14 lg:py-16"
        style={{
          background:
            'linear-gradient(160deg, color-mix(in srgb, rgb(var(--card)) 55%, transparent) 0%, color-mix(in srgb, rgb(var(--card)) 35%, transparent) 100%)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid color-mix(in srgb, rgb(var(--ink)) 12%, transparent)',
          boxShadow:
            '0 1px 0 color-mix(in srgb, #fff 35%, transparent) inset, 0 30px 80px -20px rgba(15,23,42,0.25), 0 0 0 1px color-mix(in srgb, #fff 8%, transparent) inset',
        }}
      >
        <DBadge />

        <h2 className="mb-5 text-[36px] font-extrabold leading-[1.12] tracking-tightest text-ink lg:text-[56px]">
          지금 무료로
          <br />
          <span className="bg-cta-gradient bg-clip-text text-transparent">
            시작하세요
          </span>
        </h2>
        <p className="mx-auto mb-9 max-w-[560px] text-[17px] leading-[1.6] text-muted">
          신용카드 없이 1분 가입. 거래 100건까지 영구 무료.
          <br />
          첫 결과를 받아본 뒤 결정해도 늦지 않습니다.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-7 py-[15px] text-[15px] font-bold tracking-[-0.005em] text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] transition-colors hover:bg-brand-2"
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
            className="rounded-[10px] px-6 py-3.5 text-[15px] font-medium tracking-[-0.005em] text-ink"
            style={{
              background:
                'color-mix(in srgb, rgb(var(--card)) 50%, transparent)',
              border:
                '1px solid color-mix(in srgb, rgb(var(--ink)) 14%, transparent)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            요금제 비교
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-1 gap-4 border-y border-ink/10 py-6 lg:grid-cols-3 lg:gap-0">
          <Stat2 num="1,550만" label="한국 가상자산 투자자" />
          <Stat2
            num="22%"
            label="양도소득세율"
            sub="소득세 20% + 지방세 2%"
            border
          />
          <Stat2 num="250만원" label="기본공제" sub="연 1회 자동 적용" />
        </div>
      </div>
    </section>
  );
}
