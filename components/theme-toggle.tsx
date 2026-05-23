'use client';
import { useEffect, useState } from 'react';

// SSR/hydration 시점에 data-theme 값을 신뢰할 수 있도록 (layout.tsx 의 bootScript 가
// 첫 paint 전 setAttribute 함) — 첫 render 도 같은 값을 쓰면 1-2 frame icon flash 가
// 사라진다. ssr 컨텍스트에서 document 가 없으므로 false → mounted 이후 정확값 교정.
function getInitialTheme(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

export function ThemeToggle() {
  const [dark, setDark] = useState(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // hydration 후 SSR/CSR 차이 보정 — bootScript 가 cookie/localStorage 에서
    // 읽어 setAttribute 한 값을 다시 읽어 sync.
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try {
      localStorage.setItem('kontaxt-theme', next ? 'dark' : 'light');
    } catch {}
  }

  const label = dark ? '라이트 모드로 전환' : '다크 모드로 전환';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      // mounted 전에는 visibility hidden 처리해 hydration mismatch 와 1 frame icon flash 둘 다 방지.
      // 크기는 동일하게 점유해 layout shift 없음.
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-transparent text-ink-2 transition-colors duration-150 hover:bg-bg-soft"
      style={mounted ? undefined : { visibility: 'hidden' }}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
