'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthCard } from '@/components/auth/AuthCard';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    // mock
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthCard
        title="이메일을 확인해주세요"
        subtitle={`${email} 으로 비밀번호 재설정 링크를 보냈습니다. 받은 편지함을 확인하세요.`}
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
      subtitle="가입 시 사용한 이메일을 입력하면 재설정 링크를 보내드립니다."
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
        <Button type="submit" fullWidth>
          재설정 링크 보내기
        </Button>
      </form>
    </AuthCard>
  );
}
