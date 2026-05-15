'use client';
import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { HoverCard } from '@/components/ui/HoverCard';
import {
  SectionEyebrow,
  SectionTitle,
  SectionLead,
} from '@/components/ui/section-heading';

type ExchangeId = 'upbit' | 'bithumb' | 'binance';

interface CSVCardProps {
  exchange: string;
  id: ExchangeId;
  logo: string;
  color: string;
  ink?: string;
  format: 'PDF' | 'XLS' | 'CSV';
  rows: ReadonlyArray<readonly [string, string]>;
  quirks: readonly string[];
  highlight: boolean;
  onHover: () => void;
}

function CSVCard({
  exchange,
  logo,
  color,
  ink,
  format,
  rows,
  quirks,
  highlight,
  onHover,
}: CSVCardProps) {
  return (
    <HoverCard
      onMouseEnter={onHover}
      onFocus={onHover}
      tabIndex={0}
      aria-label={`${exchange} 거래내역 형식 (${format})`}
      className="overflow-hidden rounded-[14px] border bg-card transition-[border-color,box-shadow] duration-200"
      style={{
        borderColor: highlight ? color : 'rgb(var(--line))',
        boxShadow: highlight
          ? `0 0 0 4px ${color}15, var(--shadow-md)`
          : 'var(--shadow-sm)',
      }}
    >
      {/* Colored header bar */}
      <div
        className="flex items-center justify-between px-[18px] py-3.5"
        style={{ background: color, color: ink || '#fff' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-white">
            <Image
              src={logo}
              alt={exchange}
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <span className="nowrap text-[15px] font-bold tracking-[-0.01em]">
            {exchange}
          </span>
        </div>
        <span
          className="nowrap rounded-full px-2 py-[3px] font-mono text-[11px] font-semibold"
          style={{ background: 'rgba(0,0,0,0.18)', color: ink || '#fff' }}
        >
          .{format.toLowerCase()}
        </span>
      </div>

      {/* Body — mono comment + table */}
      <div className="p-4">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.04em] text-muted-2">
          # BTC 0.005 매수 · 425,212원
        </div>
        <table className="w-full border-collapse text-xs">
          <tbody>
            {rows.map(([k, v], i) => (
              <tr
                key={k}
                className={
                  i === rows.length - 1 ? '' : 'border-b border-line-2'
                }
              >
                <td className="py-[7px] font-mono font-medium text-muted">{k}</td>
                <td className="num py-[7px] text-right font-mono font-medium text-ink">
                  {v}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quirks footer */}
      <div className="flex flex-wrap gap-1.5 border-t border-line-2 bg-bg-soft px-4 py-2.5">
        {quirks.map((q) => (
          <span
            key={q}
            className="nowrap rounded-full border border-line-2 bg-card px-2 py-[3px] text-[10.5px] font-medium text-muted"
          >
            {q}
          </span>
        ))}
      </div>
    </HoverCard>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone?: 'bad' }) {
  const palette =
    tone === 'bad'
      ? { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' }
      : null;

  if (palette) {
    return (
      <span
        className="nowrap rounded-sm px-3 py-2 font-mono text-xs font-medium"
        style={{
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          color: palette.text,
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span className="nowrap rounded-sm border border-line bg-bg-soft px-3 py-2 font-mono text-xs font-medium text-ink-2">
      {children}
    </span>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="14"
      viewBox="0 0 32 14"
      fill="none"
      className={'flex-shrink-0 ' + (className ?? '')}
      aria-hidden="true"
    >
      <path
        d="M2 7h26m0 0l-6-5m6 5l-6 5"
        stroke="rgb(var(--muted-2))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const cards: Array<Omit<CSVCardProps, 'highlight' | 'onHover'>> = [
  {
    exchange: '업비트',
    id: 'upbit',
    logo: '/logos/upbit.png',
    color: '#0E48F0',
    format: 'PDF',
    rows: [
      ['체결시간', '2027.01.15 09:32:11'],
      ['마켓', 'KRW-BTC'],
      ['종류', '매수'],
      ['거래수량', '0.005'],
      ['거래단가', '85,000,000'],
      ['거래금액', '425,000 KRW'],
      ['수수료(0.05%)', '213 KRW'],
      ['정산금액', '425,213 KRW'],
      ['주문시간', '2027.01.15 09:32:09'],
    ],
    quirks: ['PDF 전용', '점 구분 날짜', '체결·주문시간 2개'],
  },
  {
    exchange: '빗썸',
    id: 'bithumb',
    logo: '/logos/bithumb.png',
    color: '#F37321',
    format: 'XLS',
    rows: [
      ['거래일시', '2027/01/15 18:32'],
      ['주문구분', '매수'],
      ['코인명', 'BTC'],
      ['거래수량', '0.005'],
      ['체결가격', '85,000,000'],
      ['거래금액', '425,000 원'],
      ['수수료(0.04%)', '170 원'],
      ['결제금액', '425,170 원'],
      ['정산구분', '원화 마켓'],
    ],
    quirks: ['슬래시 날짜', '컬럼명 다름', '쿠폰 적용 수수료'],
  },
  {
    exchange: '바이낸스',
    id: 'binance',
    logo: '/logos/binance.png',
    color: '#F0B90B',
    ink: '#1E2329',
    format: 'CSV',
    rows: [
      ['Date(UTC)', '2027-01-15 00:32'],
      ['Pair', 'BTCUSDT'],
      ['Side', 'BUY'],
      ['Order Type', 'LIMIT'],
      ['Price', '62,450'],
      ['Executed', '0.005 BTC'],
      ['Amount', '312.25 USDT'],
      ['Fee(0.1%)', '0.31 USDT'],
      ['Fee Coin', 'USDT'],
    ],
    quirks: ['UTC 시간', 'Spot/Futures 분리', 'Fee Coin 별도'],
  },
];

export function Problem() {
  const [active, setActive] = useState<ExchangeId>('upbit');

  return (
    <section id="problem" className="section-pad">
      <div className="mx-auto max-w-content">
        <SectionEyebrow>PROBLEM</SectionEyebrow>
        <SectionTitle>
          같은 BTC 매수인데, 거래소마다
          <br />
          <span className="text-muted">형식이 전부 다릅니다</span>
        </SectionTitle>
        <SectionLead>
          한국 투자자 평균 2.4개 거래소 사용. 파일 형식·날짜·통화 단위가 모두 달라
          <br />
          엑셀로 합치는 데만 반나절이 걸립니다.
        </SectionLead>

        {/* 3-card grid */}
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {cards.map((c) => (
            <CSVCard
              key={c.id}
              {...c}
              highlight={active === c.id}
              onHover={() => setActive(c.id)}
            />
          ))}
        </div>

        {/* Reconciliation diagram */}
        <div className="mt-8 grid grid-cols-1 items-center gap-6 rounded-lg border border-line bg-bg-soft px-6 py-6 sm:px-8 sm:py-7 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:px-10 lg:py-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Pill tone="bad">PDF · KRW · 한글</Pill>
            <Pill tone="bad">XLS · 원 · 한글</Pill>
            <Pill tone="bad">CSV · USDT · UTC</Pill>
          </div>
          <ArrowRight className="hidden lg:block" />
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="nowrap text-xs font-medium text-muted">크립토택스가 통일</div>
              <div className="nowrap text-base font-bold text-ink">한국 세법 표준 포맷</div>
            </div>
          </div>
          <ArrowRight className="hidden lg:block" />
          <div className="flex justify-center">
            <div className="min-w-[140px] rounded-[10px] border border-good/40 bg-good-soft px-7 py-2.5 text-center">
              <div className="nowrap mb-0.5 text-[11px] font-semibold text-good">
                처리 시간
              </div>
              <div className="num text-[18px] font-extrabold text-good">3초</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
