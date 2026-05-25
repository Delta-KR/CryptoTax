'use client';

import { useEffect } from 'react';

// 루트 error boundary — 서버/클라이언트 unhandled throw 시 fallback.
// 사용자에게 자세한 스택은 노출하지 않고, 다시 시도 버튼 + 메인으로 이동만.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vercel 로그에 digest 와 함께 남기 — 사용자 메시지에는 노출 X.
    console.error('[app/error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-3 text-[16px] font-bold text-ink">
          예기치 못한 오류가 발생했어요
        </div>
        <p className="mb-5 text-[13px] leading-[1.6] text-muted">
          페이지를 표시하는 중 문제가 발생했어요. 다시 시도하거나 메인으로
          돌아가주세요.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-2"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="rounded-md border border-line bg-card px-4 py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-bg-soft"
          >
            메인으로
          </a>
        </div>
        {error.digest && (
          <p className="mt-4 text-[11px] text-muted-2">참조: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
