'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/sections/mobile-nav';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const navLinks = [
  { href: '/#how', label: '작동 방식' },
  { href: '/#exchanges', label: '지원 거래소' },
  { href: '/#features', label: '기능' },
  { href: '/#security', label: '보안' },
  { href: '/simulator', label: '세금 계산기' },
  { href: '/guide', label: '사용 가이드' },
  { href: '/#pricing', label: '요금제' },
];

/**
 * client component — auth state 만 클라이언트에서 읽어서
 * marketing layout 전체를 static 으로 유지 (audit perf P1-2 Best 옵션).
 * 로그인 사용자에게 한 frame "로그인" → "대시보드" 깜빡임이 발생하지만
 * marketing 페이지 로그인 사용자 비중이 작아 수용 가능 (audit 권장).
 */
export function Nav() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setIsAuthed(!!data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setIsAuthed(!!session);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <nav
      aria-label="주 메뉴"
      className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-[20px] backdrop-saturate-[1.8]"
    >
      <div className="mx-auto flex max-w-content items-center justify-between px-8 py-3.5">
        <Link href="/" className="flex items-center gap-2" aria-label="Kontaxt 홈으로">
          {/* mark.svg는 1500x1500 정사각 viewBox에 마크가 작게 들어가 있어
              h-8로 두면 실제 시각 마크는 한 변 ~12px 수준. 텍스트 워드마크를
              함께 노출해 인지도 보완. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.svg" alt="" className="h-8 w-8 shrink-0" />
          <span className="text-[17px] font-bold tracking-[-0.02em] text-ink">
            kontaxt.
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-body text-ink-2 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="hidden rounded-sm bg-brand px-4 py-[9px] text-body font-semibold tracking-[-0.005em] text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_1px_2px_rgba(37,99,235,0.2)] transition-colors hover:bg-brand-2 md:inline-block"
            >
              대시보드
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden px-3.5 py-2 text-body font-medium text-ink-2 transition-colors hover:text-ink md:inline-block"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-sm bg-brand px-4 py-[9px] text-body font-semibold tracking-[-0.005em] text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_1px_2px_rgba(37,99,235,0.2)] transition-colors hover:bg-brand-2 md:inline-block"
              >
                무료 시작
              </Link>
            </>
          )}
          <MobileNav links={navLinks} isAuthed={isAuthed} />
        </div>
      </div>
    </nav>
  );
}
