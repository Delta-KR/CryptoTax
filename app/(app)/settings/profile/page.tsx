'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { getCurrentUser, signOut } from '@/lib/mock/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/mock/profile';

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', language: 'ko' });
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    setProfile(getProfile(u ?? undefined));
  }, []);

  function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    updateProfile(profile);
    toast.show('프로필이 저장되었습니다.', 'success');
  }

  function handlePwChange(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (!oldPw || !newPw || !newPwConfirm) {
      setPwError('모든 필드를 입력해주세요.');
      return;
    }
    if (newPw.length < 8) {
      setPwError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPw !== newPwConfirm) {
      setPwError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    // mock — 항상 success
    setOldPw('');
    setNewPw('');
    setNewPwConfirm('');
    toast.show('비밀번호가 변경되었습니다.', 'success');
  }

  function handleDelete() {
    signOut();
    setDeleteOpen(false);
    router.replace('/');
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
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
            <Input
              label="이메일"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
            <Select
              label="언어"
              value={profile.language}
              onChange={(e) =>
                setProfile((p) => ({ ...p, language: e.target.value as 'ko' | 'en' }))
              }
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </Select>
            <div className="flex justify-end pt-1">
              <Button type="submit">저장</Button>
            </div>
          </form>
        </Card>

        {/* 비밀번호 변경 */}
        <Card padding="lg">
          <h2 className="mb-5 text-[16px] font-bold text-ink">비밀번호 변경</h2>
          <form onSubmit={handlePwChange} className="flex flex-col gap-4" noValidate>
            <Input
              label="현재 비밀번호"
              type="password"
              autoComplete="current-password"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
            />
            <Input
              label="새 비밀번호"
              type="password"
              autoComplete="new-password"
              helper="8자 이상"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <Input
              label="새 비밀번호 확인"
              type="password"
              autoComplete="new-password"
              value={newPwConfirm}
              onChange={(e) => setNewPwConfirm(e.target.value)}
              error={pwError ?? undefined}
            />
            <div className="flex justify-end pt-1">
              <Button type="submit" variant="secondary">
                비밀번호 변경
              </Button>
            </div>
          </form>
        </Card>

        {/* 위험 영역 */}
        <Card padding="lg" className="border-bad/30 bg-bad-soft/50">
          <h2 className="text-[16px] font-bold text-bad">위험 영역</h2>
          <p className="mt-1.5 text-[13px] text-ink-2">
            회원 탈퇴 시 모든 거래 데이터와 계산 결과가 삭제되며 복구할 수 없습니다.
          </p>
          <div className="mt-4">
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              회원 탈퇴
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="정말 탈퇴하시겠어요?"
        description="이 작업은 되돌릴 수 없습니다. 모든 거래 데이터, 세금 계산 결과, 결제 내역이 영구 삭제됩니다."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              탈퇴 확인
            </Button>
          </>
        }
      />
    </>
  );
}
