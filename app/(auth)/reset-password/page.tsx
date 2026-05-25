'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthCard } from '@/components/auth/AuthCard';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { isPasswordValid } from '@/lib/auth/password-rules';
import { updateUserPassword } from '@/lib/auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// 비번 재설정 메일 링크 클릭 → Supabase가 recovery 세션 발급 후 이 페이지로 redirect.
// 페이지 마운트 시점에 세션이 활성화돼 있으면 새 비밀번호 입력 → updateUser 호출.
export default function ResetPasswordPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setAuthChecked(true);
    });
  }, []);

  const passwordOk = isPasswordValid(password);
  const matches = password === confirm && confirm.length > 0;
  const formReady = passwordOk && matches;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordOk) {
      setError('비밀번호 조건을 모두 충족해주세요.');
      return;
    }
    if (!matches) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }
    setSubmitting(true);
    try {
      await updateUserPassword(password);
      setSuccess(true);
      setSubmitting(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '비밀번호 변경 실패');
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <AuthCard title="확인 중…" subtitle="잠시만 기다려주세요.">
        <div className="py-4 text-center text-[13px] text-muted">세션 확인 중</div>
      </AuthCard>
    );
  }

  if (!hasSession) {
    return (
      <AuthCard
        title="유효하지 않은 링크"
        subtitle="비밀번호 재설정 링크가 만료됐거나 이미 사용됐어요."
        footer={
          <Link href="/forgot-password" className="font-medium text-brand underline">
            비밀번호 재설정 다시 요청
          </Link>
        }
      >
        <div className="rounded-md border border-bad/40 bg-bad-soft px-4 py-3 text-[13px] text-bad">
          링크가 유효하지 않아요. 비밀번호 찾기 페이지에서 새 메일을 요청해 주세요.
        </div>
      </AuthCard>
    );
  }

  if (success) {
    return (
      <AuthCard
        title="비밀번호 변경 완료"
        subtitle="새 비밀번호로 로그인할 수 있어요."
        footer={
          <Link href="/login" className="font-medium text-brand underline">
            로그인으로 이동
          </Link>
        }
      >
        <div className="rounded-md border border-good/40 bg-good-soft px-4 py-3 text-[13px] text-good">
          비밀번호가 안전하게 저장됐어요.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="새 비밀번호 설정"
      subtitle="안전한 새 비밀번호를 입력해주세요."
      footer={
        <Link href="/login" className="font-medium text-brand underline">
          로그인으로 돌아가기
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="안전한 비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />
        <PasswordStrength password={password} />
        <Input
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          placeholder="동일하게 다시 입력"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={submitting}
          error={error ?? undefined}
        />
        <Button type="submit" fullWidth disabled={submitting || !formReady}>
          {submitting ? '변경 중…' : '비밀번호 변경'}
        </Button>
      </form>
    </AuthCard>
  );
}
