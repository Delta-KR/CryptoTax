'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Naver OAuth 등 자체 flow의 magic link verify가 끝난 직후 도착하는 페이지.
// Supabase admin generateLink로 발급된 link는 redirect_to URL fragment에
// access_token/refresh_token을 박아 보냄 (implicit flow). 이 fragment는
// server로 전송되지 않아 middleware가 인증을 확인하지 못함 → 곧장 /dashboard로
// 보내면 /login으로 튕김.
//
// 여기서 setSession을 명시 호출해 supabase/ssr이 cookies까지 동기화하도록 한 뒤
// /dashboard로 이동시킴. server component (page.tsx) 가 cookie 의 nonce
// 검증을 이미 통과한 후 도달하므로 phishing fragment 차단됨 (P1-6).
export function FinishClient() {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'error'>('pending');

  useEffect(() => {
    async function finish() {
      const supabase = createSupabaseBrowserClient();
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        setStatus('error');
        router.replace('/login?error=invalid_request');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('[auth/finish] setSession error:', error);
        setStatus('error');
        router.replace('/login?error=server_error');
        return;
      }

      // 세션 cookies 동기화 완료 → 대시보드로
      router.replace('/dashboard');
    }
    finish();
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-3 text-[15px] font-medium text-ink">
          {status === 'pending' ? '로그인 처리 중…' : '로그인에 문제가 있어요'}
        </div>
        <div className="text-[13px] text-muted">
          {status === 'pending'
            ? '잠시만 기다려주세요.'
            : '잠시 후 로그인 페이지로 이동해요.'}
        </div>
      </div>
    </div>
  );
}
