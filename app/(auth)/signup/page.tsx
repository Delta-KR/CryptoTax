'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { AuthCard, AuthDivider } from '@/components/auth/AuthCard';
import { SocialButtons } from '@/components/auth/SocialButtons';
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from '@/components/auth/TurnstileWidget';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { signUpWithPassword } from '@/lib/auth';
import { isPasswordValid } from '@/lib/auth/password-rules';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';

// Pricing 섹션 CTA에서 ?plan=free|subscription|annual로 의도가 전달됨.
// 결제(Phase 7) 출시 전까지는 sessionStorage에 보관해 추후 checkout에서 사용.
type PendingPlan = 'free' | 'subscription' | 'annual';
const PLAN_VALUES: ReadonlyArray<PendingPlan> = ['free', 'subscription', 'annual'];
const PLAN_LABEL: Record<PendingPlan, string> = {
  free: '무료',
  subscription: '구독',
  annual: '단일 과세연도',
};

export default function SignupPage() {
  const router = useRouter();
  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('plan');
    if (p && (PLAN_VALUES as ReadonlyArray<string>).includes(p)) {
      setPendingPlan(p as PendingPlan);
    }
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const handleToken = useCallback((t: string) => setCaptchaToken(t), []);
  const handleCaptchaError = useCallback(
    () => setError('보안 검증 실패. 페이지를 새로고침 해주세요.'),
    [],
  );

  const captchaReady = !TURNSTILE_ENABLED || captchaToken !== null;
  const passwordOk = isPasswordValid(password);
  const formReady =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    passwordOk &&
    agree &&
    captchaReady;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError('이름, 이메일, 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (!passwordOk) {
      setError('비밀번호 조건을 모두 충족해주세요.');
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
      if (pendingPlan && pendingPlan !== 'free') {
        try {
          sessionStorage.setItem('kontaxt-pending-plan', pendingPlan);
        } catch {}
      }
      const { needsEmailConfirmation, alreadyRegistered: existing } =
        await signUpWithPassword(
          email.trim(),
          password,
          name.trim(),
          captchaToken || undefined,
        );
      if (existing) {
        setAlreadyRegistered(true);
        setSubmitting(false);
      } else if (needsEmailConfirmation) {
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
      subtitle="1분이면 가입 완료. 결제 전 결과 미리보기까지 무료."
      footer={
        <>
          이미 회원이신가요?{' '}
          <Link href="/login" className="font-medium text-brand underline">
            로그인
          </Link>
        </>
      }
    >
      {alreadyRegistered ? (
        <div className="rounded-md border border-warn/40 bg-warn-soft px-4 py-5 text-[13px] leading-[1.6] text-warn">
          <div className="mb-1 font-bold">이미 가입된 이메일입니다</div>
          <div className="mb-3">
            <strong>{email}</strong>은 이미 Kontaxt 계정으로 등록돼 있어요.
            기존 비밀번호로 로그인하거나, 비밀번호를 잊으셨다면 재설정하세요.
          </div>
          <div className="flex gap-2">
            <Link
              href={`/login?email=${encodeURIComponent(email)}`}
              className="rounded-md border border-warn/50 px-3 py-1.5 text-[12.5px] font-medium text-warn hover:bg-warn/10"
            >
              로그인 →
            </Link>
            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className="rounded-md px-3 py-1.5 text-[12.5px] font-medium text-warn underline"
            >
              비밀번호 재설정
            </Link>
          </div>
        </div>
      ) : success ? (
        <div className="rounded-md border border-good/40 bg-good-soft px-4 py-5 text-[13px] leading-[1.6] text-good">
          <div className="mb-1 font-bold">인증 이메일 발송 완료</div>
          <div>
            <strong>{email}</strong>로 인증 메일을 보냈어요.
            받은 메일의 링크를 클릭하면 가입이 완료되고 자동 로그인돼요.
          </div>
        </div>
      ) : (
        <>
      {pendingPlan && pendingPlan !== 'free' && (
        <div className="mb-4 rounded-md border border-brand/30 bg-brand-soft px-3.5 py-3 text-[12.5px] leading-[1.55] text-brand-2">
          <strong className="font-semibold">선택한 플랜: {PLAN_LABEL[pendingPlan]}</strong>
          <span className="text-ink-2/80">
            {' '}— 결제는 곧 출시 예정. 지금 가입하면 결과를 무료로 미리보고 출시 시 우선
            알림을 받아요.
          </span>
        </div>
      )}
      <FormErrorBanner message={error} />
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
          placeholder="안전한 비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />
        <PasswordStrength password={password} />
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
          disabled={submitting || !formReady}
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
