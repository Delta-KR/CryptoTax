'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { HoverCard } from '@/components/ui/HoverCard';
import { signOut } from '@/lib/auth';

const items = [
  {
    href: '/settings/profile',
    label: '프로필 관리',
    description: '이름, 이메일, 비밀번호 변경',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    color: '#2563EB',
  },
  {
    href: '/settings/notifications',
    label: '알림 설정',
    description: '이메일 / 인앱 알림 토글',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: '#7C3AED',
  },
];

export default function SettingsPage() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <>
      <PageHeader title="설정" description="프로필, 알림, 로그아웃 등 계정 관련 설정." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <HoverCard className="flex items-center gap-4 rounded-lg border border-line bg-card p-5 shadow-sm">
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md"
                style={{
                  background: `color-mix(in srgb, ${item.color} 12%, rgb(var(--card)))`,
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-ink">{item.label}</div>
                <div className="mt-0.5 text-[12px] text-muted">{item.description}</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="rgb(var(--muted))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </HoverCard>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-4 flex w-full items-center gap-4 rounded-lg border border-line bg-card p-5 text-left shadow-sm transition-colors hover:bg-bg-soft"
      >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-bad-soft text-bad">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-ink">로그아웃</div>
          <div className="mt-0.5 text-[12px] text-muted">현재 세션 종료</div>
        </div>
      </button>
    </>
  );
}
