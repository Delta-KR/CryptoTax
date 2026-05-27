'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from '@/components/auth/TurnstileWidget';
import { hasEmailIdentity } from '@/lib/auth';
import { useUserContext } from '@/components/app-chrome/UserContextProvider';
import { isPasswordValid } from '@/lib/auth/password-rules';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  changePassword,
  deleteAccount,
  updateDisplayName,
} from '@/app/actions/account';

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading } = useUserContext();

  const [name, setName] = useState('');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  // 에러를 입력란별로 분리해 사용자가 어느 필드를 고쳐야 할지 즉시 알 수 있게.
  const [oldPwError, setOldPwError] = useState<string | null>(null);
  const [newPwError, setNewPwError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [oauthOnly, setOauthOnly] = useState(false);
  // 회원탈퇴 모달 안 외부 권한 해제 안내용. Naver/Google 별 link 분기.
  // [[project_naver_auto_relogin_followup]] — 우리 측 user 삭제 후도 Naver 권한
  // 연결은 살아있어 NID_AUT cookie 가 있으면 자동 재로그인됨. 사용자 직접
  // 외부 권한 해제 권장.
  const [oauthProvider, setOauthProvider] = useState<'naver' | 'google' | null>(
    null,
  );
  // Turnstile: token은 1회용. 제출 후 widget을 재마운트해서 새 token을 받기 위한 key.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const handleCaptchaToken = useCallback(
    (t: string) => setCaptchaToken(t || null),
    [],
  );
  const handleCaptchaError = useCallback(() => setCaptchaToken(null), []);
  const captchaReady = !TURNSTILE_ENABLED || captchaToken !== null;

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  // OAuth-only 여부는 클라이언트에서 supabase.auth.getUser()로 확인.
  // useCurrentUser는 profiles 정보만 노출하므로 별도 호출.
  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      setOauthOnly(!hasEmailIdentity(data.user));
      // provider 식별 — user_metadata.provider 와 app_metadata.provider 둘 다
      // 확인. 우리 callback (admin.generateLink) 이 user_metadata 에 박는데
      // Supabase verify 가 app_metadata 를 reset 하는 케이스 [[reference_naver_oauth_state_cookie]].
      const userMeta = data.user.user_metadata ?? {};
      const appMeta = data.user.app_metadata ?? {};
      const p = userMeta.provider ?? appMeta.provider;
      if (p === 'naver' || p === 'google') setOauthProvider(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const result = await updateDisplayName(name);
    if (result.ok) {
      // 서버에서 user_metadata.name이 변경됐지만 클라이언트 supabase 인스턴스는 모름.
      // refreshSession()이 TOKEN_REFRESHED를 emit → useCurrentUser의 onAuthStateChange 트리거
      // → 우측 상단 UserMenu 즉시 갱신.
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.refreshSession();
      } catch {
        // refresh 실패해도 server-side 저장은 성공 — 다음 페이지 로드 시 반영됨.
      }
      toast.show('이름이 저장됐어요.', 'success');
    } else {
      toast.show(result.error ?? '저장 실패', 'error');
    }
    setSavingName(false);
  }

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
    // Turnstile token은 검증 시 소모됨 → 다음 시도를 위해 widget 재마운트.
    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);
    if (result.ok) {
      setOldPw('');
      setNewPw('');
      setNewPwConfirm('');
      toast.show('비밀번호가 변경됐어요.', 'success');
      return;
    }
    // 서버가 돌려준 code에 따라 적절한 입력란에 에러 표시.
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

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAccount();
    // deleteAccount 성공 시 server-side redirect('/')가 발생해 여기는 도달 X.
    setDeleting(false);
    if (!result.ok) {
      toast.show(result.error ?? '계정 삭제 실패', 'error');
      setDeleteOpen(false);
      return;
    }
    router.replace('/');
  }

  if (loading || !user) {
    return null;
  }

  return (
    <>
      <PageHeader title="프로필 관리" description="개인 정보와 비밀번호를 관리해요." />

      <div className="flex flex-col gap-5">
        {/* 기본 정보 */}
        <Card padding="lg">
          <h2 className="mb-5 text-[16px] font-bold text-ink">기본 정보</h2>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4" noValidate>
            <Input
              label="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={savingName}
            />
            <Input
              label="이메일"
              type="email"
              value={user.email}
              readOnly
              helper="이메일 변경은 지원팀에 문의해주세요."
            />
            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={savingName || name === user.name}>
                {savingName ? '저장 중…' : '저장'}
              </Button>
            </div>
          </form>
        </Card>

        {/* 비밀번호 변경 — OAuth-only 계정은 hide */}
        {!oauthOnly && (
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
        )}

        {oauthOnly && (
          <Card padding="lg">
            <h2 className="mb-2 text-[16px] font-bold text-ink">비밀번호</h2>
            <p className="text-[13px] text-muted">
              소셜 로그인으로 가입한 계정이에요. 비밀번호 관리는 연결된 소셜 제공자(예: Google,
              Kakao)에서 진행해 주세요.
            </p>
          </Card>
        )}

        {/* 위험 영역 */}
        <Card padding="lg" className="border-bad/30 bg-bad-soft/50">
          <h2 className="text-[16px] font-bold text-bad">위험 영역</h2>
          <p className="mt-1.5 text-[13px] text-ink-2">
            회원 탈퇴 시 모든 거래 데이터와 계산 결과가 삭제되고 복구할 수 없어요.
          </p>
          <div className="mt-4">
            <Button variant="danger" onClick={() => setDeleteOpen(true)} disabled={deleting}>
              회원 탈퇴
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => (!deleting ? setDeleteOpen(false) : undefined)}
        title="정말 탈퇴하시겠어요?"
        description="이 작업은 되돌릴 수 없어요. 모든 거래 데이터, 세금 계산 결과, 결제 내역이 영구 삭제돼요."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? '탈퇴 처리 중…' : '탈퇴 확인'}
            </Button>
          </>
        }
      >
        {oauthProvider && (
          <div className="rounded-md border border-line-2 bg-bg-soft px-4 py-3 text-[13px] leading-[1.55] text-ink-2">
            <p className="font-medium text-ink">
              {oauthProvider === 'naver' ? '네이버' : '구글'} 권한 해제도 같이 해 주세요.
            </p>
            <p className="mt-1.5">
              Kontaxt 데이터는 바로 삭제돼요. 다만{' '}
              {oauthProvider === 'naver' ? '네이버' : '구글'} 측 권한이
              그대로 남아 있어, 다음에 같은 계정으로 로그인하면 동의 화면 없이
              바로 새 계정이 만들어져요.
            </p>
            <a
              href={
                oauthProvider === 'naver'
                  ? 'https://nid.naver.com/user2/help/myInfoV2?lang=ko_KR'
                  : 'https://myaccount.google.com/permissions'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1 text-brand transition-colors hover:text-brand-2"
            >
              {oauthProvider === 'naver' ? '네이버' : '구글'}에서 권한 해제하기 →
            </a>
          </div>
        )}
      </Modal>
    </>
  );
}
