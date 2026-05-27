'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { deleteAccount } from '@/app/actions/account';

// 회원 탈퇴 danger zone + Modal. self-contained own state (deleteOpen,
// deleting). OAuth provider 안내는 props 로 받음 — Naver/Google 외부
// 권한 해제 link ([[project_naver_auto_relogin_followup]] layer 4).
export function DangerZoneCard({
  oauthProvider,
}: {
  oauthProvider: 'naver' | 'google' | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAccount();
    // deleteAccount 성공 시 server-side redirect('/') 발생해 여기는 도달 X.
    setDeleting(false);
    if (!result.ok) {
      toast.show(result.error ?? '계정 삭제 실패', 'error');
      setDeleteOpen(false);
      return;
    }
    router.replace('/');
  }

  return (
    <>
      <Card padding="lg" className="border-bad/30 bg-bad-soft/50">
        <h2 className="text-[16px] font-bold text-bad">위험 영역</h2>
        <p className="mt-1.5 text-[13px] text-ink-2">
          회원 탈퇴 시 모든 거래 데이터와 계산 결과가 삭제되고 복구할 수 없어요.
        </p>
        <div className="mt-4">
          <Button
            variant="danger"
            onClick={() => setDeleteOpen(true)}
            disabled={deleting}
          >
            회원 탈퇴
          </Button>
        </div>
      </Card>

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
              {oauthProvider === 'naver' ? '네이버' : '구글'} 권한 해제 안내
            </p>
            <p className="mt-1.5">
              {oauthProvider === 'naver'
                ? 'Kontaxt 가 네이버 권한 해제도 자동으로 시도해요. 다만 토큰이 만료된 경우엔 실패할 수 있으니, 다음 링크에서 직접 확인해 주세요.'
                : 'Kontaxt 데이터는 바로 삭제돼요. 다만 구글 측 권한이 그대로 남아 있어, 다음 링크에서 직접 해제해 주세요.'}
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
              {oauthProvider === 'naver' ? '네이버' : '구글'}에서 권한 해제 확인하기 →
            </a>
          </div>
        )}
      </Modal>
    </>
  );
}
