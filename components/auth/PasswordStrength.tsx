'use client';
import { PASSWORD_RULES } from '@/lib/auth/password-rules';

export interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  return (
    <div
      role="list"
      aria-label="비밀번호 조건"
      className="-mt-1 flex flex-col gap-1 rounded-md border border-line bg-bg-soft px-3 py-2.5"
    >
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <div
            key={rule.key}
            role="listitem"
            className={
              'flex items-center gap-1.5 text-[12px] leading-[1.5] transition-colors ' +
              (passed
                ? 'font-semibold text-good'
                : 'text-muted-2')
            }
          >
            <span
              aria-hidden="true"
              className="flex h-3.5 w-3.5 flex-none items-center justify-center"
            >
              {passed ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 7.5L5.5 10L11 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="7" cy="7" r="2" fill="currentColor" opacity="0.5" />
                </svg>
              )}
            </span>
            <span>{rule.label}</span>
            <span className="sr-only">{passed ? '— 충족' : '— 미충족'}</span>
          </div>
        );
      })}
    </div>
  );
}
