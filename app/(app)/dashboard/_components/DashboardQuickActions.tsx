import Link from 'next/link';
import { HoverCard } from '@/components/ui/HoverCard';

// 대시보드 빠른 액션 3-card grid. DESIGN.md §3 보라 금지 — 단일 brand
// blue + good 색만 사용.
const quickActions = [
  {
    href: '/transactions/upload',
    label: '거래 데이터 업로드',
    description: 'CSV / PDF / XLS 파일 통합',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    color: 'rgb(var(--brand))',
    soft: 'rgb(var(--brand-faint))',
  },
  {
    href: '/tax',
    label: '세금 계산',
    description: '한국 세법 기준 자동 계산',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    color: 'rgb(var(--brand))',
    soft: 'rgb(var(--brand-soft))',
  },
  {
    href: '/report',
    label: 'PDF 리포트',
    description: '신고용 항목별 정리 PDF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 3v5h5M9 14l3 3 3-3M12 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'rgb(var(--good))',
    soft: 'rgb(var(--good-soft))',
  },
];

export function DashboardQuickActions() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {quickActions.map((a) => (
        <HoverCard
          key={a.href}
          className="rounded-lg border border-line bg-card p-5 shadow-sm"
        >
          <Link href={a.href} className="block">
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-md"
              style={{
                background: `color-mix(in srgb, ${a.color} 12%, rgb(var(--card)))`,
                color: a.color,
              }}
            >
              {a.icon}
            </div>
            <div className="text-[15px] font-bold text-ink">{a.label}</div>
            <div className="mt-1 text-[12px] text-muted">{a.description}</div>
          </Link>
        </HoverCard>
      ))}
    </div>
  );
}
