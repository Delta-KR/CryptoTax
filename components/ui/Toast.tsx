'use client';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'info' | 'error';

interface ToastItem {
  id: string;
  message: string;
  tone: Tone;
}

interface ToastContextValue {
  show: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<Tone, string> = {
  success: 'border-good/40 bg-good-soft text-good',
  info: 'border-line bg-card text-ink',
  error: 'border-bad/40 bg-bad-soft text-bad',
};

// error는 행동을 요구하므로 자동 dismiss 안 함 (X 버튼으로만 닫힘).
// success/info는 6초 — 4초는 긴 메시지를 다 읽기 전에 사라짐.
const AUTO_DISMISS_MS: Record<Tone, number | null> = {
  success: 6000,
  info: 6000,
  error: null,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: Tone = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, tone }]);
      const ms = AUTO_DISMISS_MS[tone];
      if (ms !== null) {
        setTimeout(() => dismiss(id), ms);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        role="region"
        aria-label="알림"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            aria-live={t.tone === 'error' ? 'assertive' : 'polite'}
            className={cn(
              'pointer-events-auto flex max-w-md items-start gap-3 rounded-md border px-4 py-3 text-[13px] font-medium leading-[1.55] shadow-md sm:max-w-lg',
              toneStyles[t.tone],
            )}
          >
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
              {t.message}
            </span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="알림 닫기"
              className="-mr-1 -mt-0.5 flex-shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
