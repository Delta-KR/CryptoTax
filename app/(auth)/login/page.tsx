'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthCard, AuthDivider } from '@/components/auth/AuthCard';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from '@/components/auth/TurnstileWidget';
import { signInWithPassword } from '@/lib/auth';
import { safeNext } from '@/lib/auth/safe-next';
import { classifyOAuthError, oauthErrorMessage } from '@/lib/auth/oauth-errors';

export default function LoginPage() {
  const router = useRouter();
  const [nextUrl, setNextUrl] = useState('/dashboard');
  const [oauthError, setOauthError] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextUrl(safeNext(params.get('next')));
    // Supabase는 OTP 만료 시 error=access_denied + error_code=otp_expired 둘 다 박아 보냄.
    // error_code를 우선 매칭해 otp_expired를 access_denied보다 정확히 분류.
    const err = params.get('error');
    const errCode = params.get('error_code');
    const errDesc = params.get('error_description');
    if (err || errCode) {
      setOauthError(oauthErrorMessage(classifyOAuthError(errCode ?? errDesc ?? err)));
    }
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 빈 필드별 aria-invalid + aria-describedby 신호용. 폼-레벨 에러는 FormErrorBanner 가 별도.
  const [emailFieldError, setEmailFieldError] = useState<string | undefined>();
  const [passwordFieldError, setPasswordFieldError] = useState<string | undefined>();
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
    const emailEmpty = !email.trim();
    const passwordEmpty = !password;
    setEmailFieldError(emailEmpty ? '이메일을 입력해주세요.' : undefined);
    setPasswordFieldError(passwordEmpty ? '비밀번호를 입력해주세요.' : undefined);
    if (emailEmpty || passwordEmpty) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (TURNSTILE_ENABLED && !captchaToken) {
      setError('보안 검증을 완료해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await signInWithPassword(
        email.trim(),
        password,
        captchaToken || undefined,
      );
      router.replace(nextUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인 실패');
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="로그인"
      subtitle="Kontaxt 계정으로 계속하세요."
      footer={
        <>
          회원이 아니신가요?{' '}
          <Link href="/signup" className="font-medium text-brand underline">
            가입
          </Link>
        </>
      }
    >
      <FormErrorBanner message={oauthError} />
      <FormErrorBanner message={error} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailFieldError) setEmailFieldError(undefined);
          }}
          disabled={submitting}
          error={emailFieldError}
        />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordFieldError) setPasswordFieldError(undefined);
          }}
          disabled={submitting}
          error={passwordFieldError}
        />
        <div className="-mt-1 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[12px] text-muted underline-offset-2 hover:text-ink-2 hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        <TurnstileWidget onToken={handleToken} onError={handleCaptchaError} />
        <Button
          type="submit"
          fullWidth
          disabled={submitting || !captchaReady}
        >
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>

      <AuthDivider label="또는" />
      <SocialButtons nextUrl={nextUrl} />
    </AuthCard>
  );
}
