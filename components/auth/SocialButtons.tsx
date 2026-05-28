'use client';
import { useState } from 'react';
import { signInWithOAuth, type SupabaseNativeOAuthProvider } from '@/lib/auth';

interface ProviderConfig {
  id: SupabaseNativeOAuthProvider | 'naver';
  name: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
  enabled: boolean;
  // Supabase native가 아닌 자체 OAuth flow (예: Naver)는 customHref로 직접 navigate.
  customHref?: string;
}

const providers: ProviderConfig[] = [
  {
    id: 'google',
    name: 'Google',
    bg: '#fff',
    text: '#1F2937',
    border: '1px solid rgb(var(--line))',
    enabled: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.61z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26a5.4 5.4 0 01-8.09-2.84H.96v2.33A9 9 0 009 18z" />
        <path fill="#FBBC05" d="M3.96 10.71c-.18-.55-.29-1.13-.29-1.71s.1-1.16.29-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3-2.33z" />
        <path fill="#EA4335" d="M9 3.58a4.86 4.86 0 013.44 1.35l2.58-2.58A9 9 0 009 0 9 9 0 00.96 4.96L3.96 7.3A5.36 5.36 0 019 3.58z" />
      </svg>
    ),
  },
  {
    id: 'naver',
    name: '네이버',
    bg: '#03C75A',
    text: '#fff',
    border: '0',
    enabled: true,
    customHref: '/api/auth/naver/start',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M10.18 8.55 5.5 1.6H1.83v12.8h4V7.45l4.68 6.95h3.66V1.6h-3.99v6.95z" />
      </svg>
    ),
  },
  {
    // Kakao 로그인 일시 비활성 (KOE205 임시 조치 2026-05-26) — 비활성이라 맨 밑 배치.
    // 원인: Supabase 가 default scope 으로 account_email/profile_image/profile_nickname
    // 요청하는데 Kakao Console 에 동의항목 등록 안 됨. account_email 은 비즈 앱 전용
    // (사업자등록 필요 — 2026-06 중순 모두의 창업 진출 후 진행).
    id: 'kakao',
    name: '카카오',
    bg: '#FEE500',
    text: '#1F2937',
    border: '0',
    enabled: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
        <path d="M9 1.5C4.86 1.5 1.5 4.16 1.5 7.43c0 2.13 1.41 3.99 3.52 5.04l-.9 3.27c-.08.28.24.5.48.34l3.93-2.6c.15.01.31.02.47.02 4.14 0 7.5-2.65 7.5-5.92S13.14 1.5 9 1.5z" />
      </svg>
    ),
  },
];

interface SocialButtonsProps {
  nextUrl?: string;
}

export function SocialButtons({ nextUrl }: SocialButtonsProps = {}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAuth(p: ProviderConfig) {
    if (!p.enabled) return;
    setError(null);
    setPending(p.id);
    try {
      // 자체 OAuth flow (Naver 등) — Next.js API route로 직접 navigate.
      if (p.customHref) {
        window.location.href = p.customHref;
        return;
      }
      await signInWithOAuth(p.id as SupabaseNativeOAuthProvider, { nextUrl });
      // browser navigates away to OAuth provider — no need to clear pending here
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OAuth 로그인 실패');
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {providers.map((p) => {
        const isPending = pending === p.id;
        const disabled = !p.enabled || pending !== null;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => handleAuth(p)}
            disabled={disabled}
            aria-label={
              p.enabled
                ? `${p.name} 계정으로 계속`
                : `${p.name} (준비 중)`
            }
            className={
              'inline-flex w-full items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-[13px] font-semibold transition-opacity ' +
              (p.enabled && !isPending && !disabled
                ? 'hover:opacity-90'
                : 'cursor-not-allowed opacity-50')
            }
            style={{
              background: p.bg,
              color: p.text,
              border: p.border,
            }}
          >
            {p.icon}
            {isPending
              ? '연결 중…'
              : p.enabled
                ? `${p.name}로 계속`
                : `${p.name}로 계속 (준비 중)`}
          </button>
        );
      })}
      {error && (
        <p className="text-center text-[11.5px] text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
