import Link from 'next/link';

export function PremiumBanner() {
  return (
    // DESIGN.md §7/§8: brand→purple 그라디언트 안티패턴 제거. 단일 brand 색 + brand-glow.
    <div
      className="mb-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-[14px] bg-brand px-7 py-6 shadow-brand-glow sm:flex-row sm:items-center"
    >
      <div className="min-w-0 text-white">
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] backdrop-blur-sm">
          Premium Only
        </div>
        <div className="text-[18px] font-extrabold leading-[1.3] tracking-[-0.01em]">
          정확한 납부세액 + 코인별 손익 + PDF 리포트
        </div>
        <p className="mt-1 text-[13px] leading-[1.5] text-white/85">
          단일 과세연도 ₩49,900 — 결제 후 즉시 전체 결과를 확인할 수 있어요.
        </p>
      </div>
      <Link href="/billing" className="flex-shrink-0">
        <button
          type="button"
          className="group relative whitespace-nowrap rounded-md bg-white px-5 py-3 text-[14px] font-extrabold text-brand shadow-md transition-colors hover:bg-bg-soft"
        >
          <span className="absolute inset-0 -z-10 animate-pulse rounded-md bg-white/60 blur-md" />
          유료 플랜 보기 →
        </button>
      </Link>
    </div>
  );
}
