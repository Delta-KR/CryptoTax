'use client';
import { useCallback, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from '@/components/auth/TurnstileWidget';
import { isPasswordValid } from '@/lib/auth/password-rules';
import { changePassword } from '@/app/actions/account';

// 비밀번호 변경 form. self-contained — own state (old/new/confirm + errors +
// captcha + changingPw). server result code 별 inline 에러 매핑.
// OAuth-only 사용자는 부모 page 에서 hide (이 컴포넌트 호출 안 함).
export function PasswordChangeForm() {
  const toast = useToast();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [oldPwError, setOldPwError] = useState<string | null>(null);
  const [newPwError, setNewPwError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [changingPw, setChangingPw] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const handleCaptchaToken = useCallback(
    (t: string) => setCaptchaToken(t || null),
    [],
  );
  const handleCaptchaError = useCallback(() => setCaptchaToken(null), []);
  const captchaReady = !TURNSTILE_ENABLED || captchaToken !== null;

  function clearPwErrors() {
    setOldPwError(null);
    setNewPwError(null);
    setConfirmError(null);
  }

  async function handlePwChange(e: FormEvent) {
    e.preventDefault();
    clearPwErrors();
    if (!oldPw) {
      setOldPwError('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (!newPw) {
      setNewPwError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (!newPwConfirm) {
      setConfirmError('새 비밀번호 확인을 입력해주세요.');
      return;
    }
    if (!isPasswordValid(newPw)) {
      setNewPwError('새 비밀번호 조건을 모두 충족해주세요.');
      return;
    }
    if (newPw !== newPwConfirm) {
      setConfirmError('새 비밀번호가 일치하지 않아요.');
      return;
    }
    if (TURNSTILE_ENABLED && !captchaToken) {
      toast.show('보안 검증을 완료해주세요.', 'error');
      return;
    }
    setChangingPw(true);
    const result = await changePassword({
      oldPassword: oldPw,
      newPassword: newPw,
      captchaToken: captchaToken || undefined,
    });
    setChangingPw(false);
    // Turnstile token 은 검증 시 소모됨 → 다음 시도를 위해 widget 재마운트.
    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);
    if (result.ok) {
      setOldPw('');
      setNewPw('');
      setNewPwConfirm('');
      toast.show('비밀번호가 변경됐어요.', 'success');
      return;
    }
    // server code 에 따른 inline 에러 매핑.
    switch (result.code) {
      case 'wrong_password':
        setOldPwError(result.error ?? '기존 비밀번호가 일치하지 않아요.');
        break;
      case 'weak':
        setNewPwError(result.error ?? '새 비밀번호 조건을 충족하지 않아요.');
        break;
      case 'captcha_failed':
      case 'oauth_only':
      case 'missing_email':
      case 'unauthenticated':
        toast.show(result.error ?? '비밀번호 변경 실패', 'error');
        break;
      default:
        setConfirmError(result.error ?? '비밀번호 변경 실패');
    }
  }

  return (
    <Card padding="lg">
      <h2 className="mb-5 text-[16px] font-bold text-ink">비밀번호 변경</h2>
      <form onSubmit={handlePwChange} className="flex flex-col gap-4" noValidate>
        <Input
          label="현재 비밀번호"
          type="password"
          autoComplete="current-password"
          value={oldPw}
          onChange={(e) => {
            setOldPw(e.target.value);
            if (oldPwError) setOldPwError(null);
          }}
          disabled={changingPw}
          error={oldPwError ?? undefined}
        />
        <Input
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          value={newPw}
          onChange={(e) => {
            setNewPw(e.target.value);
            if (newPwError) setNewPwError(null);
          }}
          disabled={changingPw}
          error={newPwError ?? undefined}
        />
        <PasswordStrength password={newPw} />
        <Input
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={newPwConfirm}
          onChange={(e) => {
            setNewPwConfirm(e.target.value);
            if (confirmError) setConfirmError(null);
          }}
          disabled={changingPw}
          error={confirmError ?? undefined}
        />
        <TurnstileWidget
          key={captchaResetKey}
          onToken={handleCaptchaToken}
          onError={handleCaptchaError}
        />
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="secondary"
            disabled={changingPw || !captchaReady}
          >
            {changingPw ? '변경 중…' : '비밀번호 변경'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
