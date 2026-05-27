'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
}

interface Props {
  links: ReadonlyArray<NavLink>;
  isAuthed: boolean;
}

export function MobileNav({ links, isAuthed }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // SSR 안전 — document 접근은 mount 후만.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while sheet is open; close on Esc.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Portal 으로 document.body 에 mount — nav 의 backdrop-blur 가 stacking
  // context + fixed positioning containing block 을 만들어서 자식 fixed
  // dialog 가 viewport 가 아닌 nav 영역으로 한정되는 문제 회피.
  const sheet = open ? (
    <div
      id="mobile-nav-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="주 메뉴"
      className="fixed inset-0 z-[60] md:hidden"
    >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-[86%] max-w-[360px] flex-col border-l border-line bg-bg shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-base font-bold tracking-[-0.01em] text-ink">메뉴</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:bg-bg-soft"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav aria-label="모바일 주 메뉴" className="flex flex-1 flex-col px-2 py-3">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-[15px] font-medium text-ink-2 transition-colors hover:bg-bg-soft hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-2 border-t border-line px-5 py-5">
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-sm bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-2"
                >
                  대시보드
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block w-full rounded-sm border border-line bg-card px-4 py-2.5 text-center text-sm font-medium text-ink-2 transition-colors hover:bg-bg-soft"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="block w-full rounded-sm bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-2"
                  >
                    무료 시작
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        aria-controls="mobile-nav-sheet"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-transparent text-ink-2 transition-colors hover:bg-bg-soft md:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {mounted && sheet && createPortal(sheet, document.body)}
    </>
  );
}
