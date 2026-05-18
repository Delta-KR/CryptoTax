'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  getTaxProRequest,
  submitTaxProRequest,
  type TaxProRequest,
} from '@/lib/mock/billing';

export default function TaxProPage() {
  const toast = useToast();
  const [existing, setExisting] = useState<TaxProRequest | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [period, setPeriod] = useState('상반기');
  const [notes, setNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setExisting(getTaxProRequest());
  }, []);

  function openConfirm(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      toast.show('이름과 연락처를 입력해주세요.', 'error');
      return;
    }
    setConfirmOpen(true);
  }

  function handleSubmit() {
    setSubmitting(true);
    const req = submitTaxProRequest({
      name: name.trim(),
      contact: contact.trim(),
      preferredPeriod: period,
      notes: notes.trim(),
    });
    setExisting(req);
    setConfirmOpen(false);
    setSubmitting(false);
    toast.show('세무사 매칭 신청이 접수되었습니다.', 'success');
  }

  if (existing) {
    return (
      <>
        <PageHeader
          title="세무사 매칭"
          description="제휴 세무사와 연결해드립니다."
        />
        <Card padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-ink">매칭 신청 현황</h2>
            <Pill tone="warn" dot>
              {existing.status}
            </Pill>
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                신청자
              </dt>
              <dd className="mt-1 text-[14px] text-ink">{existing.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                연락처
              </dt>
              <dd className="num mt-1 text-[14px] text-ink">{existing.contact}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                희망 시기
              </dt>
              <dd className="mt-1 text-[14px] text-ink">{existing.preferredPeriod}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                신청일
              </dt>
              <dd className="num mt-1 text-[14px] text-ink">
                {new Date(existing.submittedAt).toLocaleDateString('ko-KR')}
              </dd>
            </div>
          </dl>
          {existing.notes && (
            <div className="mt-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                메모
              </dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-md bg-bg-soft px-3 py-2.5 text-[13px] text-ink-2">
                {existing.notes}
              </dd>
            </div>
          )}
          <div className="mt-6 rounded-md border border-brand/30 bg-brand-faint px-4 py-3 text-[13px] text-brand-2">
            영업일 기준 2일 이내에 매칭 결과를 이메일과 SMS로 안내드립니다.
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="세무사 매칭"
        description="가상자산 양도소득 신고 경험이 있는 제휴 세무사와 연결해드립니다."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <Card padding="lg">
          <h2 className="text-[16px] font-bold text-ink">매칭 신청</h2>
          <p className="mt-1 text-[13px] text-muted">
            아래 정보를 작성하시면 평일 기준 2일 이내에 연결해드립니다.
          </p>
          <form onSubmit={openConfirm} className="mt-5 flex flex-col gap-4" noValidate>
            <Input
              label="이름"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
            <Input
              label="연락처"
              placeholder="010-0000-0000"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={submitting}
            />
            <Select
              label="희망 시기"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={submitting}
            >
              <option>상반기</option>
              <option>5월 신고 시즌</option>
              <option>하반기</option>
              <option>가능한 빨리</option>
            </Select>
            <Textarea
              label="메모 (선택)"
              placeholder="신고 관련 특이사항이나 질문이 있다면 입력해주세요."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={submitting}>
                매칭 신청
              </Button>
            </div>
          </form>
        </Card>

        <Card padding="md" surface="card-2">
          <h3 className="text-[14px] font-bold text-ink">제휴 세무사 안내</h3>
          <ul className="mt-3 flex flex-col gap-2.5 text-[13px] text-muted">
            <li className="flex gap-2">
              <span className="text-good">✓</span>
              가상자산 양도소득 신고 경력 5년 이상
            </li>
            <li className="flex gap-2">
              <span className="text-good">✓</span>
              Kontaxt 리포트 형식에 익숙
            </li>
            <li className="flex gap-2">
              <span className="text-good">✓</span>
              평균 응답 시간 1시간 이내
            </li>
            <li className="flex gap-2">
              <span className="text-good">✓</span>
              일반 신고 대비 평균 30% 빠른 처리
            </li>
          </ul>
          <p className="mt-4 rounded-sm bg-bg-soft px-3 py-2 text-[11px] text-muted-2">
            매칭 자체는 무료. 실제 수임료는 세무사와 협의.
          </p>
        </Card>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="매칭 신청을 제출하시겠어요?"
        description="입력하신 정보로 제휴 세무사 풀에 신청이 등록됩니다."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? '제출 중…' : '신청 제출'}
            </Button>
          </>
        }
      />
    </>
  );
}
