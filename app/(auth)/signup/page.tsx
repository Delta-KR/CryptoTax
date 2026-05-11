'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { AuthCard, AuthDivider } from '@/components/auth/AuthCard';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { signUp } from '@/lib/mock/auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError('이름, 이메일, 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (!agree) {
      setError('이용약관에 동의해주세요.');
      return;
    }
    setSubmitting(true);
    signUp(name.trim(), email.trim(), password);
    router.replace('/dashboard');
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
          placeholder="8자 이상"
          helper="영문/숫자 조합 8자 이상"
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
              <Link href="#" className="text-brand underline">
                이용약관
              </Link>{' '}
              및{' '}
              <Link href="#" className="text-brand underline">
                개인정보처리방침
              </Link>
              에 동의합니다
            </span>
          }
        />
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? '가입 중…' : '무료로 가입'}
        </Button>
      </form>

      <AuthDivider label="또는" />
      <SocialButtons />
    </AuthCard>
  );
}
