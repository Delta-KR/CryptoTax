'use client';
import { useState } from 'react';
import { SectionEyebrow } from '@/components/ui/section-heading';

type Method = 'fifo' | 'avg';

interface Item {
  coin: string;
  name: string;
  buy: number;
  sell: number;
  color: string;
}

const items: readonly Item[] = [
  { coin: 'BTC', name: '비트코인', buy: 3000, sell: 5000, color: '#F7931A' },
  { coin: 'ETH', name: '이더리움', buy: 1000, sell: 700, color: '#627EEA' },
  { coin: 'SOL', name: '솔라나', buy: 500, sell: 800, color: '#9945FF' },
];

interface CalcRowProps {
  label: string;
  value: string;
  sub?: string;
  tone?: 'good';
  bold?: boolean;
}

function CalcRow({ label, value, sub, tone, bold }: CalcRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <div className="min-w-0">
        <div
          className={
            'nowrap text-[13px] ' +
            (bold ? 'font-bold text-ink' : 'font-medium text-muted')
          }
        >
          {label}
        </div>
        {sub && (
          <div className="nowrap mt-px text-[11px] text-muted-2">{sub}</div>
        )}
      </div>
      <div
        className={
          'num nowrap tracking-[-0.01em] ' +
          (bold ? 'text-[17px] font-bold' : 'text-[15px] font-semibold') +
          ' ' +
          (tone === 'good' ? 'text-good' : 'text-ink')
        }
      >
        {value}
      </div>
    </div>
  );
}

function Divider({ thick }: { thick?: boolean }) {
  return (
    <div
      className={'my-1.5 ' + (thick ? 'h-0.5 bg-ink/10' : 'h-px bg-line')}
    />
  );
}

function ToggleSegment({
  current,
  onChange,
}: {
  current: Method;
  onChange: (m: Method) => void;
}) {
  const options: ReadonlyArray<readonly [Method, string]> = [
    ['fifo', '선입선출'],
    ['avg', '이동평균'],
  ];
  return (
    <div
      role="group"
      aria-label="계산 방식 선택"
      className="flex gap-1 rounded-sm bg-bg-tint p-1"
    >
      {options.map(([k, lbl]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          aria-pressed={current === k}
          className={
            'rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors ' +
            (current === k
              ? 'bg-card text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
              : 'bg-transparent text-muted hover:text-ink-2')
          }
        >
          {lbl}
        </button>
      ))}
    </div>
  );
}

function TradesCard({
  method,
  setMethod,
}: {
  method: Method;
  setMethod: (m: Method) => void;
}) {
  return (
    <div
      className="glass overflow-hidden rounded-lg shadow-md"
      style={{
        background: 'color-mix(in srgb, rgb(var(--card)) 75%, transparent)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid color-mix(in srgb, rgb(var(--line)) 60%, transparent)',
      }}
    >
      <div className="flex items-center justify-between border-b border-line-2 px-6 py-[18px]">
        <div>
          <div className="nowrap mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-muted-2">
            STEP 1
          </div>
          <div className="nowrap text-[15px] font-bold text-ink">거래 내역 손익</div>
        </div>
        <ToggleSegment current={method} onChange={setMethod} />
      </div>

      <div className="px-6 pb-4 pt-2">
        {items.map((it, i) => {
          const diff = it.sell - it.buy;
          const isGain = diff >= 0;
          return (
            <div
              key={it.coin}
              className={
                'grid grid-cols-[1fr_auto] items-center gap-3 py-4 ' +
                (i === items.length - 1 ? '' : 'border-b border-line-2')
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold tracking-tightish"
                  style={{ background: `${it.color}18`, color: it.color }}
                >
                  {it.coin}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{it.name}</div>
                  <div className="num font-mono text-[11.5px] text-muted">
                    매수 {it.buy.toLocaleString()}만 → 매도 {it.sell.toLocaleString()}만
                  </div>
                </div>
              </div>
              <div
                className={
                  'num nowrap text-[18px] font-bold tracking-[-0.01em] ' +
                  (isGain ? 'text-good' : 'text-bad')
                }
              >
                {isGain ? '+' : ''}
                {diff.toLocaleString()}만원
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalculationCard({
  totalGain,
  taxable,
  tax,
}: {
  totalGain: number;
  taxable: number;
  tax: number;
}) {
  return (
    <div
      className="glass flex flex-col rounded-lg px-7 py-6 shadow-sm"
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, rgb(var(--card)) 75%, transparent) 0%, color-mix(in srgb, rgb(var(--card-2)) 75%, transparent) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid color-mix(in srgb, rgb(var(--line)) 60%, transparent)',
      }}
    >
      <div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-muted-2">
        STEP 2
      </div>
      <div className="mb-[18px] text-[15px] font-bold text-ink">세액 산출</div>

      <CalcRow label="총 양도차익" value={`+${totalGain.toLocaleString()}만원`} tone="good" />
      <CalcRow label="기본공제" value="−250만원" sub="연 1회" />
      <Divider />
      <CalcRow label="과세표준" value={`${taxable.toLocaleString()}만원`} bold />
      <CalcRow label="× 세율" value="22%" sub="소득세 20% + 지방세 2%" />
      <Divider thick />

      {/* Brand-filled result box */}
      <div className="mt-2 rounded-md bg-brand px-[22px] py-5 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)]">
        <div className="nowrap mb-1 text-xs font-medium opacity-90">
          2027년 5월 납부 세액
        </div>
        <div className="num nowrap text-[36px] font-extrabold leading-[1.05] tracking-tighter3">
          {tax.toLocaleString()}
          <span className="ml-1 text-[18px] font-semibold">만원</span>
        </div>
      </div>
    </div>
  );
}

function SectionBlob({
  className,
  style,
}: {
  className?: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={'pointer-events-none absolute z-0 ' + (className ?? '')}
      style={style}
    />
  );
}

export function Example() {
  const [method, setMethod] = useState<Method>('fifo');

  const totalGain = items.reduce((s, i) => s + (i.sell - i.buy), 0);
  const taxable = Math.max(0, totalGain - 250);
  const tax = Math.round(taxable * 0.22);

  return (
    <section className="section-pad relative">
      {/* Section-local blobs (separate from global atmosphere) */}
      <SectionBlob
        style={{
          top: '20%',
          left: '-10%',
          width: 500,
          height: 500,
          background:
            'radial-gradient(closest-side, color-mix(in srgb, rgb(var(--brand)) 20%, transparent), transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <SectionBlob
        style={{
          bottom: '10%',
          right: '-8%',
          width: 480,
          height: 480,
          background:
            'radial-gradient(closest-side, color-mix(in srgb, #8B5CF6 18%, transparent), transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-content">
        <div className="mb-14 text-center">
          <SectionEyebrow>TAX CALCULATION</SectionEyebrow>
          <h2 className="mb-4 text-[32px] font-extrabold leading-[1.15] tracking-tighter3 text-ink lg:text-[44px]">
            실제 계산은 <span className="text-brand">이렇게</span> 됩니다
          </h2>
          <p className="mx-auto max-w-[580px] text-[17px] leading-[1.6] text-muted">
            BTC 익절, ETH 손절, SOL 익절. 한국 세법 기준 어떻게 계산되는지 보세요.
          </p>
        </div>

        <div className="mx-auto grid max-w-[1080px] gap-6 lg:grid-cols-[1.2fr_1fr]">
          <TradesCard method={method} setMethod={setMethod} />
          <CalculationCard totalGain={totalGain} taxable={taxable} tax={tax} />
        </div>
      </div>
    </section>
  );
}
