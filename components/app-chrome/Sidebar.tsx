'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/auth';

interface MenuItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const menu: MenuItem[] = [
  {
    href: '/dashboard',
    label: '대시보드',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 12l9-9 9 9M5 10v10h14V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: '거래 내역',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <ellipse cx="12" cy="5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: '/tax',
    label: '세금 계산',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0M8 19h2M12 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/report',
    label: '리포트',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/billing',
    label: '구독 및 결제',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M2 11h20M6 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: '설정',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

interface SidebarProps {
  user: User;
  variant?: 'desktop' | 'drawer';
  onNavigate?: () => void;
}

export function Sidebar({ user, variant = 'desktop', onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-line bg-card',
        variant === 'desktop'
          ? 'fixed left-0 top-0 hidden h-screen w-[240px] lg:flex'
          : 'h-full w-full'
      )}
    >
      <Link
        href="/"
        onClick={onNavigate}
        className="flex h-[60px] items-center border-b border-line px-6 text-base font-bold tracking-[-0.01em] text-ink"
      >
        Kontaxt
      </Link>

      <nav aria-label="대시보드 메뉴" className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {menu.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors',
                    active
                      ? 'bg-brand-faint text-brand'
                      : 'text-ink-2 hover:bg-bg-soft hover:text-ink'
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-brand" />
                  )}
                  <span className={active ? 'text-brand' : 'text-muted'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User pill at bottom */}
      <div className="border-t border-line px-3 py-3">
        <Link
          href="/settings/profile"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-bg-soft"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-ink">
              {user.name}
            </span>
            <span className="block truncate text-[11px] text-muted">
              {user.email}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
