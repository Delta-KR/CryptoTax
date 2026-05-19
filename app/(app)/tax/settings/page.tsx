'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { getTaxMethod, setTaxMethod, type TaxMethod } from '@/lib/mock/tax';
import { calculateTaxFromFiles } from '@/app/actions/calculate';
import {
  loadSession,
  replaceCalculation,
} from '@/lib/storage/session';
import { cn } from '@/lib/utils';

interface MethodOption {
  id: TaxMethod;
  name: string;
  short: string;
  description: string;
  pros: string[];
  cons: string[];
}

const options: MethodOption[] = [
  {
    id: 'fifo',
    name: '선입선출법 (FIFO)',
    short: 'First-In First-Out',
    description: '먼저 매수한 코인부터 매도된 것으로 계산합니다. 한국 세법 기본 방식.',
    pros: ['직관적이고 계산이 단순', '국세청 권장 방식', '대부분의 거래소 호환'],
    cons: ['장기 보유분 처분 시 과세표준 높을 수 있음', '시세 변동성 큰 코인에 불리'],
  },
  {
    id: 'avg',
    name: '이동평균법 (MA)',
    short: 'Moving Average',
    description: '각 매수 시점마다 평균 취득가를 갱신하며, 매도 시 평균가를 사용.',
    pros: ['매수가 평탄화 → 변동성 큰 코인 유리', '세무 처리 시 일관성'],
    cons: ['매수마다 평균 재계산 필요', '거래소별 평균이 다를 수 있음'],
  },
];

export default function TaxSettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState<TaxMethod>('fifo');
  const [selected, setSelected] = useState<TaxMethod>('fifo');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const m = getTaxMethod();
    setCurrent(m);
    setSelected(m);
  }, []);

  async function handleApply() {
    // 1) localStorage 선호 갱신.
    setTaxMethod(selected);
    setCurrent(selected);

    // 2) 세션에 거래 데이터가 있으면 새 method로 즉시 재계산.
    const session = loadSession();
    const hasData = (session?.allParsed.length ?? 0) > 0;

    if (!hasData) {
      toast.show(
        `계산 방식이 ${selected === 'fifo' ? '선입선출법' : '이동평균법'}으로 변경되었습니다. 다음 업로드부터 적용됩니다.`,
        'success',
      );
      router.push('/tax');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      // 신규 파일 없음 — 기존 parsed 데이터를 그대로 사용해 재계산만 트리거.
      formData.append(
        'previousParsed',
        JSON.stringify(session?.allParsed ?? []),
      );
      formData.append('method', selected);

      const result = await calculateTaxFromFiles(formData);
      if (!result.ok) {
        // 실패 시 localStorage 롤백.
        setTaxMethod(current);
        setCurrent(current);
        toast.show(`재계산 실패: ${result.error}`, 'error');
        setSubmitting(false);
        return;
      }
      replaceCalculation(result.payload);
      toast.show(
        `${selected === 'fifo' ? '선입선출법' : '이동평균법'}으로 재계산 완료`,
        'success',
      );
      router.push('/tax');
    } catch (e) {
      setTaxMethod(current);
      setCurrent(current);
      const msg = e instanceof Error ? e.message : '재계산 중 오류';
      toast.show(msg, 'error');
      setSubmitting(false);
    }
  }

  const dirty = current !== selected;

  return (
    <>
      <PageHeader
        title="계산 방식 설정"
        description="양도소득 계산에 사용할 방식을 선택합니다. 변경 시 모든 연도의 결과가 재계산됩니다."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {options.map((opt) => {
          const active = selected === opt.id;
          const isCurrent = current === opt.id;
          return (
            <label
              key={opt.id}
              htmlFor={`method-${opt.id}`}
              className={cn(
                'relative flex cursor-pointer flex-col rounded-lg border bg-card p-6 shadow-sm transition-colors',
                active ? 'border-brand ring-2 ring-brand/30' : 'border-line hover:border-brand/40'
              )}
            >
              <input
                id={`method-${opt.id}`}
                type="radio"
                name="tax-method"
                value={opt.id}
                checked={active}
                onChange={() => setSelected(opt.id)}
                className="peer sr-only"
              />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-bold text-ink">{opt.name}</h3>
                    {isCurrent && (
                      <Pill tone="good" size="sm">
                        현재 적용
                      </Pill>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-2">
                    {opt.short}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    active ? 'border-brand bg-brand' : 'border-line'
                  )}
                >
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>
              </div>

              <p className="mt-3 text-[13px] leading-[1.65] text-muted">
                {opt.description}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-good">
                    장점
                  </div>
                  <ul className="flex flex-col gap-1 text-[12px] text-ink-2">
                    {opt.pros.map((p) => (
                      <li key={p} className="flex gap-1.5">
                        <span className="text-good">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                    단점
                  </div>
                  <ul className="flex flex-col gap-1 text-[12px] text-muted">
                    {opt.cons.map((c) => (
                      <li key={c} className="flex gap-1.5">
                        <span>·</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg border border-line bg-card-2 px-5 py-4">
        <p className="text-[13px] text-muted">
          {submitting
            ? '재계산 중…'
            : dirty
              ? '변경사항을 적용하면 기존 거래 내역이 새 방식으로 재계산됩니다.'
              : '변경할 방식을 선택해주세요.'}
        </p>
        <Button onClick={handleApply} disabled={!dirty || submitting}>
          {submitting ? '재계산 중…' : '적용'}
        </Button>
      </div>
    </>
  );
}
