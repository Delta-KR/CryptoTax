'use client';
import { useState } from 'react';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { CoinIcon } from '@/components/ui/CoinIcon';

type Method = 'fifo' | 'avg';

interface Item {
  coin: string;
  name: string;
  // FIFO와 이동평균은 분할매수 lot이 있을 때 차익이 달라짐.
  // 데모용으로 BTC만 분할매수(저가→고가) 가정 → FIFO 차익 > 이동평균.
  // ETH·SOL은 단일 lot이라 양쪽 결과 동일.
  buyFifo: number;
  buyAvg: number;
  sell: number;
}

const items: readonly Item[] = [
  { coin: 'BTC', name: '비트코인', buyFifo: 3000, buyAvg: 3500, sell: 5000 },
  { coin: 'ETH', name: '이더리움', buyFifo: 1000, buyAvg: 1000, sell: 700 },
  { coin: 'SOL', name: '솔라나', buyFifo: 500, buyAvg: 500, sell: 800 },
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
    <div className="overflow-hidden rounded-lg border border-line bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-line-2 px-6 py-[18px]">
        <div>
          <div className="nowrap mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-muted-2">
            거래 내역 손익
          </div>
          <div className="nowrap text-[15px] font-bold text-ink">
            {method === 'fifo' ? '선입선출법(FIFO) 기준' : '이동평균법(MA) 기준'}
          </div>
        </div>
        <ToggleSegment current={method} onChange={setMethod} />
      </div>

      <div className="px-6 pb-4 pt-2">
        {items.map((it, i) => {
          const buy = method === 'fifo' ? it.buyFifo : it.buyAvg;
          const diff = it.sell - buy;
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
                <CoinIcon coin={it.coin} size={36} />
                <div>
                  <div className="text-sm font-semibold text-ink">{it.name}</div>
                  <div className="num font-mono text-[11.5px] text-muted">
                    매수 {buy.toLocaleString()}만 → 매도 {it.sell.toLocaleString()}만
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
    <div className="flex flex-col rounded-lg border border-line bg-card px-7 py-6 shadow-sm">
      <div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-muted-2">
        세액 산출
      </div>
      <div className="mb-[18px] text-[15px] font-bold text-ink">2027년 5월 신고 기준</div>

      <CalcRow label="총 양도차익" value={`+${totalGain.toLocaleString()}만원`} tone="good" />
      <CalcRow label="기본공제" value="−250만원" sub="연 1회" />
      <Divider />
      <CalcRow label="과세표준" value={`${taxable.toLocaleString()}만원`} bold />
      <CalcRow label="× 세율" value="22%" sub="소득세 20% + 지방세 2%" />
      <Divider thick />

      {/* Brand-filled result box */}
      <div className="mt-2 rounded-md bg-brand px-[22px] py-5 text-white">
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

export function Example() {
  const [method, setMethod] = useState<Method>('fifo');

  const totalGain = items.reduce(
    (s, i) => s + (i.sell - (method === 'fifo' ? i.buyFifo : i.buyAvg)),
    0,
  );
  const taxable = Math.max(0, totalGain - 250);
  const tax = Math.round(taxable * 0.22);

  // 양쪽 방식 차이 — 사용자에게 토글 효과를 명시적으로 보여주기 위한 보조 수치
  const fifoTotal = items.reduce((s, i) => s + (i.sell - i.buyFifo), 0);
  const avgTotal = items.reduce((s, i) => s + (i.sell - i.buyAvg), 0);
  const fifoTax = Math.round(Math.max(0, fifoTotal - 250) * 0.22);
  const avgTax = Math.round(Math.max(0, avgTotal - 250) * 0.22);
  const diffTax = Math.abs(fifoTax - avgTax);
  const cheaper: Method = fifoTax <= avgTax ? 'fifo' : 'avg';

  return (
    <section className="section-pad bg-bg-soft">
      <div className="mx-auto max-w-content">
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

        <div className="mx-auto mt-6 max-w-[1080px] rounded-lg border border-line-2 bg-bg-soft px-5 py-4 text-[13px] leading-[1.65] text-muted">
          <strong className="font-semibold text-ink-2">방식에 따른 세액 차이</strong>{' '}
          이 예시에서 선입선출법은{' '}
          <span className="num font-semibold text-ink">{fifoTax.toLocaleString()}만원</span>,
          이동평균법은{' '}
          <span className="num font-semibold text-ink">{avgTax.toLocaleString()}만원</span>으로
          약{' '}
          <span className="num font-semibold text-ink">{diffTax.toLocaleString()}만원</span>{' '}
          차이가 납니다. 같은 거래·같은 세법인데 분할매수 lot 평가 방식이 달라 결과가
          바뀝니다. 크립토택스는{' '}
          <strong className="font-semibold text-ink-2">
            {cheaper === 'fifo' ? '선입선출법' : '이동평균법'}
          </strong>
          이 유리한 case를 자동으로 비교해드립니다.
        </div>
      </div>
    </section>
  );
}
