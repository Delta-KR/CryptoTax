'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut, type User } from '@/lib/mock/auth';

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function handleSignOut() {
    signOut();
    router.replace('/login');
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="계정 메뉴"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white transition-opacity hover:opacity-90"
      >
        {user.name.slice(0, 1).toUpperCase()}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[200px] overflow-hidden rounded-md border border-line bg-card shadow-md"
        >
          <div className="border-b border-line-2 px-4 py-3">
            <div className="truncate text-[13px] font-semibold text-ink">
              {user.name}
            </div>
            <div className="truncate text-[11px] text-muted">{user.email}</div>
          </div>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] text-ink-2 transition-colors hover:bg-bg-soft hover:text-ink"
          >
            설정
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full px-4 py-2.5 text-left text-[13px] text-bad transition-colors hover:bg-bad-soft"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
