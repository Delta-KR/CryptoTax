'use client';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/app-chrome/UserMenu';
import type { User } from '@/lib/auth';

interface TopbarProps {
  user: User;
  onMobileNavToggle: () => void;
}

export function Topbar({ user, onMobileNavToggle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-line bg-bg/85 px-5 backdrop-blur-[20px] backdrop-saturate-[1.8] sm:px-8">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMobileNavToggle}
        aria-label="메뉴 열기"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-2 transition-colors hover:bg-bg-soft lg:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Spacer for desktop (sidebar takes left) */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="알림"
          className="hidden h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:bg-bg-soft sm:inline-flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
