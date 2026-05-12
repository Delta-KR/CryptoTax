'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { plans, subscribe, type PlanId } from '@/lib/mock/billing';
import { upgradePlan } from '@/app/actions/upgrade-plan';
import { calculateTaxFromFiles } from '@/app/actions/calculate';
import { loadSession, saveSession } from '@/lib/storage/session';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const planParam = (params.get('plan') as PlanId) || 'premium';
  const plan = plans.find((p) => p.id === planParam) ?? plans[1];

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!cardNumber || !expiry || !cvc || !name) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    setSubmitting(true);

    // 1. Local mock subscription state
    subscribe(plan.id);

    // 2. Real plan upgrade in Supabase
    const upgrade = await upgradePlan();
    if (!upgrade.ok) {
      setError(upgrade.error ?? '플랜 업그레이드 실패');
      setSubmitting(false);
      return;
    }

    // 3. Re-calculate existing session with new plan (unmasks result)
    const session = loadSession();
    if (session?.allParsed?.length) {
      const fd = new FormData();
      fd.append('previousParsed', JSON.stringify(session.allParsed));
      const recalc = await calculateTaxFromFiles(fd);
      if (recalc.ok) {
        saveSession({
          ...session,
          result: recalc.payload.result,
          allUnified: recalc.payload.allUnified,
        });
      }
    }

    setSuccess(true);
    setSubmitting(false);
  }

  return (
    <>
      <PageHeader
        title="결제"
        description={`${plan.name} 플랜으로 업그레이드`}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        {/* Plan summary */}
        <Card padding="lg" className="h-fit">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
            선택한 플랜
          </div>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-tighter3 text-ink">
            {plan.name}
          </h2>
          <div className="mt-4 flex items-baseline gap-1.5 border-b border-line-2 pb-4">
            <span className="num text-[28px] font-extrabold tracking-tighter3 text-ink">
              {plan.price}
            </span>
            <span className="text-[13px] text-muted">{plan.billing}</span>
          </div>
          <ul className="mt-4 flex flex-col gap-2.5 text-[13px]">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 text-good">✓</span>
                <span className="text-ink-2">{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-md bg-bg-soft px-3 py-2.5 text-[11px] text-muted-2">
            언제든 해지 가능 · 환불 보장
          </div>
        </Card>

        {/* Payment form */}
        <Card padding="lg">
          <h2 className="mb-5 text-[16px] font-bold text-ink">결제 정보</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="카드 번호"
              placeholder="1234 5678 9012 3456"
              autoComplete="cc-number"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              disabled={submitting || success}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="만료일"
                placeholder="MM / YY"
                autoComplete="cc-exp"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                disabled={submitting || success}
              />
              <Input
                label="CVC"
                placeholder="123"
                autoComplete="cc-csc"
                inputMode="numeric"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                disabled={submitting || success}
              />
            </div>
            <Input
              label="카드 소유자명"
              placeholder="HONG GILDONG"
              autoComplete="cc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting || success}
              error={error ?? undefined}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[12px] text-muted-2">
                실제 결제는 발생하지 않습니다 (mock).
              </span>
              <Button type="submit" disabled={submitting || success}>
                {submitting ? '처리 중…' : `${plan.price} 결제`}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Modal
        open={success}
        onClose={() => {
          setSuccess(false);
          router.push('/billing');
        }}
        title="결제가 완료되었습니다"
        description={`${plan.name} 플랜이 활성화되었습니다. 영수증이 이메일로 발송됩니다.`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setSuccess(false);
                router.push('/billing/history');
              }}
            >
              결제 내역 보기
            </Button>
            <Button
              onClick={() => {
                setSuccess(false);
                router.push('/tax');
                toast.show('프리미엄이 활성화되었습니다. 전체 결과를 확인하세요.', 'success');
              }}
            >
              세금 결과 보기
            </Button>
          </>
        }
      />
    </>
  );
}
