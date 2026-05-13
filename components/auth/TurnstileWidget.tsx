'use client';
import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'flexible' | 'compact';
}

interface TurnstileApi {
  render: (el: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile-loader="true"]',
    );
    if (existing) {
      const check = () => {
        if (window.turnstile) resolve();
        else setTimeout(check, 50);
      };
      check();
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.turnstileLoader = 'true';
    script.onload = () => {
      const check = () => {
        if (window.turnstile) resolve();
        else setTimeout(check, 50);
      };
      check();
    };
    script.onerror = () => reject(new Error('Turnstile script failed to load'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onError?: () => void;
}

export function TurnstileWidget({ onToken, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTokenRef.current = onToken;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!SITE_KEY) {
      onTokenRef.current('');
      return;
    }
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onTokenRef.current(token),
          'error-callback': () => onErrorRef.current?.(),
          'expired-callback': () => onTokenRef.current(''),
          'timeout-callback': () => onTokenRef.current(''),
          theme: 'auto',
          size: 'flexible',
        });
      })
      .catch(() => {
        onErrorRef.current?.();
      });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget already gone */
        }
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className="flex justify-center" />;
}

export const TURNSTILE_ENABLED = Boolean(SITE_KEY);
