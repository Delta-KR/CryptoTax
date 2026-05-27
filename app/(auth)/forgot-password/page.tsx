'use client';
import Link from 'next/link';
import { useCallback, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthCard } from '@/components/auth/AuthCard';
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from '@/components/auth/TurnstileWidget';
import { requestPasswordReset } from '@/app/actions/account';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleToken = useCallback((t: string) => setCaptchaToken(t), []);
  const handleCaptchaError = useCallback(
    () => setError('보안 검증 실패. 페이지를 새로고침 해주세요.'),
    [],
  );

  const captchaReady = !TURNSTILE_ENABLED || captchaToken !== null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (TURNSTILE_ENABLED && !captchaToken) {
      setError('보안 검증을 완료해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      // server action — OAuth-only 가드 + email enumeration 방지 silent 패턴.
      // 결과 항상 ok:true (실제 발송 여부는 server-side hasEmailIdentity 검증).
      // 사용자 UX: email 인증 사용자만 실제로 이메일 받음. 다른 케이스는
      // 받은편지함에 없어도 "발송됨" 안내 그대로 표시.
      await requestPasswordReset(email.trim(), captchaToken || undefined);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이메일 발송 실패');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <AuthCard
        title="이메일을 확인해주세요"
        subtitle={`${email} 으로 비밀번호 재설정 링크를 보냈어요. 받은 편지함을 확인하세요.`}
        footer={
          <Link href="/login" className="font-medium text-brand underline">
            로그인으로 돌아가기
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-good-soft text-good">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
          >
            다른 이메일로 재시도
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="비밀번호 찾기"
      subtitle="가입 시 사용한 이메일을 입력하면 재설정 링크를 보내드려요."
      footer={
        <Link href="/login" className="font-medium text-brand underline">
          로그인으로 돌아가기
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error ?? undefined}
        />
        <TurnstileWidget onToken={handleToken} onError={handleCaptchaError} />
        <Button
          type="submit"
          fullWidth
          disabled={submitting || !captchaReady}
        >
          {submitting ? '발송 중…' : '재설정 링크 보내기'}
        </Button>
      </form>
    </AuthCard>
  );
}
