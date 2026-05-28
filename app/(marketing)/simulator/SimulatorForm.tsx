'use client';

import { useEffect, useMemo, useState } from 'react';
import { estimateTaxAndPenalty } from '@/lib/engine/penalty';

function formatKRW(n: number): string {
  return `₩${Math.round(n).toLocaleString('ko-KR')}`;
}

function parseInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function SimulatorForm() {
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);

  // SNS 공유 URL hook — mount 시 querystring 으로 입력값 복원.
  // 누군가 친구한테 보낸 URL 을 클릭한 진입자는 입력 없이 같은 결과를 본다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b = params.get('buy');
    const s = params.get('sell');
    const a = params.get('amount');
    if (b) setBuyPrice(b);
    if (s) setSellPrice(s);
    if (a) setAmount(a);
  }, []);

  const { gain, result } = useMemo(() => {
    const b = parseInput(buyPrice);
    const s = parseInput(sellPrice);
    const a = parseInput(amount);
    const g = (s - b) * a;
    return { gain: g, result: estimateTaxAndPenalty(g) };
  }, [buyPrice, sellPrice, amount]);

  const hasInput =
    buyPrice.trim() !== '' && sellPrice.trim() !== '' && amount.trim() !== '';

  const handleShare = async () => {
    if (!hasInput) return;
    const params = new URLSearchParams({
      buy: buyPrice,
      sell: sellPrice,
      amount,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard 권한 거부 — 사용자가 직접 주소창 복사하면 됨.
      // 향후 fallback (textarea select) 필요하면 추가.
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] lg:gap-8">
      {/* Input */}
      <form
        className="space-y-5 rounded-[14px] border border-line bg-card p-6 shadow-sm lg:p-7"
        onSubmit={(e) => e.preventDefault()}
        aria-label="시뮬레이터 입력"
      >
        <h3 className="text-eyebrow uppercase text-muted-2">입력</h3>
        <Input
          label="매수 가격 (1개당)"
          value={buyPrice}
          onChange={setBuyPrice}
          placeholder="예: 50,000,000"
          suffix="원"
        />
        <Input
          label="매도 가격 (1개당)"
          value={sellPrice}
          onChange={setSellPrice}
          placeholder="예: 80,000,000"
          suffix="원"
        />
        <Input
          label="수량"
          value={amount}
          onChange={setAmount}
          placeholder="예: 0.5"
          suffix="개"
        />
      </form>

      {/* Result */}
      <div className="rounded-[14px] border border-line bg-card p-6 shadow-sm lg:p-7">
        <h3 className="text-eyebrow uppercase text-muted-2">결과 · 2028.05 신고 기준</h3>

        {!hasInput ? (
          <p className="mt-6 text-[14px] leading-[1.65] text-muted">
            세 값을 모두 넣으면 자동으로 계산돼요.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            <Row
              label="양도차익"
              value={formatKRW(gain)}
              hint="(매도가 − 매수가) × 수량"
            />
            <Row
              label="산출세액"
              value={formatKRW(result.taxAmount)}
              hint="(양도차익 − 250만원) × 22% (소득세 20% + 지방세 2%)"
              emphasis
            />

            <div className="h-px bg-line" />

            <h4 className="text-eyebrow uppercase text-muted-2">
              신고 누락 시 추가 부담
            </h4>
            <Row
              label="무신고 가산세 (일반)"
              value={`+${formatKRW(result.noReportRegular)}`}
              hint="산출세액 × 20%"
              tone="warn"
            />
            <Row
              label="무신고 가산세 (부정)"
              value={`+${formatKRW(result.noReportFraud)}`}
              hint="산출세액 × 40%"
              tone="warn"
            />
            <Row
              label="납부지연 가산세 (1년)"
              value={`+${formatKRW(result.oneYearLate)}`}
              hint="산출세액 × 8.03%"
              tone="warn"
            />

            <div className="h-px bg-line" />

            <Row
              label="무신고 + 1년 지연 총 부담"
              value={`+${formatKRW(result.totalIfNoReportOneYear)}`}
              hint="신고 안 하고 1년 후 추징당하면"
              tone="warn"
              emphasis
            />

            <div className="border-t border-line pt-5">
              <button
                type="button"
                onClick={handleShare}
                aria-live="polite"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-bg-soft px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:bg-brand-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {copied ? '복사 완료 — 친구한테 보내세요' : '이 시나리오 URL 복사'}
              </button>
              <p className="mt-2 text-[11.5px] text-muted-2">
                URL만 클릭하면 같은 결과가 열려요. 카카오톡·디시·트위터에 공유해 보세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-ink">{label}</span>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 focus-within:border-brand">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="num flex-1 bg-transparent text-[15px] tabular-nums text-ink placeholder:text-muted-2 focus:outline-none"
        />
        {suffix && <span className="text-[13px] text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function Row({
  label,
  value,
  hint,
  tone = 'default',
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warn';
  emphasis?: boolean;
}) {
  const valueColor = tone === 'warn' ? 'text-warn' : 'text-ink';
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] text-muted">{label}</div>
        {hint && <div className="mt-0.5 text-[11.5px] text-muted-2">{hint}</div>}
      </div>
      <div
        className={`num shrink-0 tabular-nums ${
          emphasis ? 'text-[20px] font-extrabold' : 'text-[16px] font-semibold'
        } ${valueColor}`}
      >
        {value}
      </div>
    </div>
  );
}
