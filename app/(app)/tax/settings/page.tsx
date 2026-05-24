'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useToast } from '@/components/ui/Toast';
import { getTaxMethod, setTaxMethod, type TaxMethod } from '@/lib/client/tax';
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
  badge?: string;
}

const options: MethodOption[] = [
  {
    id: 'totalAverage',
    name: '총평균법',
    short: 'Total Average · 시행령 §88① · §92②4호',
    description:
      '거주자 가상자산 양도소득의 법정 평가방법. 과세기간(1.1~12.31) 개시일 보유분과 연내 매수분의 총가액을 총수량으로 나눈 평균단가로 매도 손익을 산정합니다.',
    pros: [
      '거주자 신고에 법정 적용 (시행령 §88①, 2025-02-28 개정)',
      '연 단위 평균이라 거래 순서 정밀도 의존이 낮음',
      '거래소·지갑 통합 (한 거주자의 모든 보유 합산)',
    ],
    cons: [
      '과세기간 종료 후 평균단가 확정 — 분기 중 중간 결과는 잠정치',
      '연내 매수 부대비용이 평균단가에 흡수되어 lot 단위 추적 불가',
    ],
    badge: '거주자 법정',
  },
  {
    id: 'fifo',
    name: '선입선출법 (FIFO)',
    short: 'First-In First-Out — 참고용 시나리오',
    description:
      '먼저 매수한 코인부터 매도된 것으로 계산하는 방식. 현행 시행령상 거주자 신고에는 적용되지 않으며, 참고용 시나리오 비교에만 사용됩니다.',
    pros: ['매도-매수 lot 매칭으로 audit trail이 명확'],
    cons: ['거주자 신고에는 비표준 — 시행령 §88①과 불일치', '연내 거래 순서에 결과가 민감'],
    badge: '참고용',
  },
  {
    id: 'avg',
    name: '이동평균법 (MA)',
    short: 'Moving Average — 시행령 §183⑥ (비거주자)',
    description:
      '매수 시마다 평균 취득가를 갱신하는 방식. 시행령 §183⑥에 따라 비거주자 가상자산 양도소득의 법정 평가방법입니다. 거주자는 적용 대상이 아닙니다.',
    pros: ['비거주자 신고 법정 (§183⑥)', '평균 자체는 매수 시점에 확정'],
    cons: ['거주자에게는 비표준', '매수마다 평균 재계산 필요'],
    badge: '비거주자',
  },
];

export default function TaxSettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState<TaxMethod>('totalAverage');
  const [selected, setSelected] = useState<TaxMethod>('totalAverage');
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

    const methodLabel =
      selected === 'totalAverage'
        ? '총평균법'
        : selected === 'fifo'
        ? '선입선출법'
        : '이동평균법';
    if (!hasData) {
      toast.show(
        `계산 방식이 ${methodLabel}으로 변경되었습니다. 다음 업로드부터 적용됩니다.`,
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
      toast.show(`${methodLabel}으로 재계산 완료`, 'success');
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
        description="거주자 가상자산 양도소득은 시행령 §88①에 따라 총평균법이 법정 방식입니다. 다른 방식은 참고용·비거주자 시나리오 비교에만 사용하세요."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {options.map((opt) => {
          const active = selected === opt.id;
          const isCurrent = current === opt.id;
          const isLegal = opt.id === 'totalAverage';
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[18px] font-bold text-ink">{opt.name}</h3>
                    {opt.badge && (
                      <Pill tone={isLegal ? 'brand' : 'neutral'} size="sm">
                        {opt.badge}
                      </Pill>
                    )}
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
