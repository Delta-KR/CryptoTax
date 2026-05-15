// Trust strip — Hero 직후 작은 신뢰/보안 시그널 라인.
// 문장이 아닌 라벨 단위. Rogo의 컴플라이언스 배지 패턴을 한국 톤으로.

interface Item {
  label: string;
  icon: React.ReactNode;
}

const ITEMS: readonly Item[] = [
  {
    label: '한국 PIPA 준수',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l8 3v6c0 4-3.5 7.5-8 9-4.5-1.5-8-5-8-9V6l8-3z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Cloudflare 봇 차단',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: '본인 데이터 격리 (RLS)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    label: '결제정보 비저장',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 11h18" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
];

export function TrustStrip() {
  return (
    <section
      aria-label="보안 및 컴플라이언스"
      className="border-y border-line bg-bg-soft"
    >
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 sm:gap-x-10 sm:px-6 lg:px-8">
        {ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-[12.5px] font-medium text-muted"
          >
            <span className="text-brand">{item.icon}</span>
            <span className="nowrap">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
