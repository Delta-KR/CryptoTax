'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { AuthCard, AuthDivider } from '@/components/auth/AuthCard';
import { SocialButtons } from '@/components/auth/SocialButtons';
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from '@/components/auth/TurnstileWidget';
import { signUpWithPassword } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);

  const handleToken = useCallback((t: string) => setCaptchaToken(t), []);
  const handleCaptchaError = useCallback(
    () => setError('보안 검증 실패. 페이지를 새로고침 해주세요.'),
    [],
  );

  const captchaReady = !TURNSTILE_ENABLED || captchaToken !== null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError('이름, 이메일, 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (password.length < 10) {
      setError('비밀번호는 10자 이상이어야 합니다.');
      return;
    }
    if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(
        '비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.',
      );
      return;
    }
    if (!agree) {
      setError('이용약관에 동의해주세요.');
      return;
    }
    if (TURNSTILE_ENABLED && !captchaToken) {
      setError('보안 검증을 완료해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUpWithPassword(
        email.trim(),
        password,
        name.trim(),
        captchaToken || undefined,
      );
      if (needsEmailConfirmation) {
        setSuccess(true);
        setSubmitting(false);
      } else {
        router.replace('/dashboard');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '가입 실패');
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="회원가입"
      subtitle="1분이면 가입 완료. 1거래소 영구 무료."
      footer={
        <>
          이미 회원이신가요?{' '}
          <Link href="/login" className="font-medium text-brand underline">
            로그인
          </Link>
        </>
      }
    >
      {success ? (
        <div className="rounded-md border border-good/40 bg-good-soft px-4 py-5 text-[13px] leading-[1.6] text-good">
          <div className="mb-1 font-bold">인증 이메일 발송 완료</div>
          <div>
            <strong>{email}</strong>로 인증 메일을 보냈습니다.
            받은 메일의 링크를 클릭하면 가입이 완료되고 자동 로그인됩니다.
          </div>
        </div>
      ) : (
        <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="이름"
          autoComplete="name"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
        />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="10자 이상"
          helper="영문 대/소문자 + 숫자 + 특수문자 포함, 10자 이상"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          error={error ?? undefined}
        />
        <Checkbox
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          disabled={submitting}
          label={
            <span className="text-[13px]">
              <Link
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline"
              >
                이용약관
              </Link>{' '}
              및{' '}
              <Link
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline"
              >
                개인정보처리방침
              </Link>
              에 동의합니다
            </span>
          }
        />
        <TurnstileWidget onToken={handleToken} onError={handleCaptchaError} />
        <Button
          type="submit"
          fullWidth
          disabled={submitting || !captchaReady}
        >
          {submitting ? '가입 중…' : '무료로 가입'}
        </Button>
      </form>

      <AuthDivider label="또는" />
      <SocialButtons />
        </>
      )}
    </AuthCard>
  );
}
