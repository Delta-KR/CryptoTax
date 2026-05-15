'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { useCurrentUser, hasEmailIdentity } from '@/lib/auth';
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
  const { user, loading } = useCurrentUser();

  const [name, setName] = useState('');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [oauthOnly, setOauthOnly] = useState(false);

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
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const result = await updateDisplayName(name);
    setSavingName(false);
    if (result.ok) {
      toast.show('이름이 저장되었습니다.', 'success');
    } else {
      toast.show(result.error ?? '저장 실패', 'error');
    }
  }

  async function handlePwChange(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (!oldPw || !newPw || !newPwConfirm) {
      setPwError('모든 필드를 입력해주세요.');
      return;
    }
    if (newPw !== newPwConfirm) {
      setPwError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!isPasswordValid(newPw)) {
      setPwError('새 비밀번호 조건을 모두 충족해주세요.');
      return;
    }
    setChangingPw(true);
    const result = await changePassword({
      oldPassword: oldPw,
      newPassword: newPw,
    });
    setChangingPw(false);
    if (result.ok) {
      setOldPw('');
      setNewPw('');
      setNewPwConfirm('');
      toast.show('비밀번호가 변경되었습니다.', 'success');
    } else {
      setPwError(result.error ?? '비밀번호 변경 실패');
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
      <PageHeader title="프로필 관리" description="개인 정보와 비밀번호를 관리합니다." />

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
                onChange={(e) => setOldPw(e.target.value)}
                disabled={changingPw}
              />
              <Input
                label="새 비밀번호"
                type="password"
                autoComplete="new-password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                disabled={changingPw}
              />
              <PasswordStrength password={newPw} />
              <Input
                label="새 비밀번호 확인"
                type="password"
                autoComplete="new-password"
                value={newPwConfirm}
                onChange={(e) => setNewPwConfirm(e.target.value)}
                disabled={changingPw}
                error={pwError ?? undefined}
              />
              <div className="flex justify-end pt-1">
                <Button type="submit" variant="secondary" disabled={changingPw}>
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
              소셜 로그인으로 가입한 계정입니다. 비밀번호 관리는 연결된 소셜 제공자(예: Google,
              Kakao)에서 진행해주세요.
            </p>
          </Card>
        )}

        {/* 위험 영역 */}
        <Card padding="lg" className="border-bad/30 bg-bad-soft/50">
          <h2 className="text-[16px] font-bold text-bad">위험 영역</h2>
          <p className="mt-1.5 text-[13px] text-ink-2">
            회원 탈퇴 시 모든 거래 데이터와 계산 결과가 삭제되며 복구할 수 없습니다.
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
        description="이 작업은 되돌릴 수 없습니다. 모든 거래 데이터, 세금 계산 결과, 결제 내역이 영구 삭제됩니다."
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
      />
    </>
  );
}
