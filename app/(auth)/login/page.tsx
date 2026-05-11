'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthCard, AuthDivider } from '@/components/auth/AuthCard';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { signIn } from '@/lib/mock/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    setSubmitting(true);
    // mock — 모든 자격증명 success
    signIn(email.trim(), password);
    router.replace('/dashboard');
  }

  return (
    <AuthCard
      title="로그인"
      subtitle="크립토택스 계정으로 계속하세요."
      footer={
        <>
          회원이 아니신가요?{' '}
          <Link href="/signup" className="font-medium text-brand underline">
            가입
          </Link>
        </>
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
          disabled={submitting}
        />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          error={error ?? undefined}
        />
        <div className="-mt-1 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[12px] text-muted underline-offset-2 hover:text-ink-2 hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>

      <AuthDivider label="또는" />
      <SocialButtons />
    </AuthCard>
  );
}
