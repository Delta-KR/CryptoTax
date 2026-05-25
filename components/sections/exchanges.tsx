import Image from 'next/image';
import { HoverCard } from '@/components/ui/HoverCard';
import { SectionEyebrow } from '@/components/ui/section-heading';

interface Exchange {
  name: string;
  sub: string;
  logo: string;
  bg: string;
  status: 'live' | 'soon';
}

const exchanges: readonly Exchange[] = [
  { name: '업비트',   sub: 'Upbit',    logo: '/logos/upbit.png',    bg: '#EEF3FF', status: 'live' },
  { name: '바이낸스', sub: 'Binance',  logo: '/logos/binance.png',  bg: '#FFFBEC', status: 'live' },
  { name: '빗썸',     sub: 'Bithumb',  logo: '/logos/bithumb.png',  bg: '#FFF0ED', status: 'soon' },
  { name: '코인원',   sub: 'Coinone',  logo: '/logos/coinone.png',  bg: '#FFF0F8', status: 'soon' },
  { name: 'Bybit',    sub: 'Bybit',    logo: '/logos/bybit.png',    bg: '#FFF7ED', status: 'soon' },
  { name: 'OKX',      sub: 'OKX',      logo: '/logos/okx.png',      bg: '#F5F5F5', status: 'soon' },
  { name: 'Bitget',   sub: 'Bitget',   logo: '/logos/bitget.png',   bg: '#E6FAF8', status: 'soon' },
  { name: 'Coinbase', sub: 'Coinbase', logo: '/logos/coinbase.png', bg: '#E8EFFF', status: 'soon' },
  { name: 'Gate.io',  sub: 'Gate.io',  logo: '/logos/gate.png',     bg: '#FFECEF', status: 'soon' },
];

function StatusPillLive() {
  return (
    <span className="nowrap inline-flex items-center gap-1.5 rounded-full border border-good/40 bg-good-soft px-2.5 py-1 text-[11.5px] font-bold tracking-[0.04em] text-good">
      <span
        className="h-1.5 w-1.5 rounded-full bg-good"
        style={{ boxShadow: '0 0 0 3px rgb(var(--good) / 0.3)' }}
      />
      LIVE
    </span>
  );
}

function StatusPillSoon() {
  return (
    <span className="nowrap rounded-full border border-warn/40 bg-warn-soft px-2.5 py-1 text-[11.5px] font-bold tracking-[0.04em] text-warn">
      COMING SOON
    </span>
  );
}

function LiveCard({ exchange }: { exchange: Exchange }) {
  return (
    <HoverCard className="flex items-center gap-3.5 rounded-[14px] border border-line bg-card px-5 py-6 shadow-sm">
      <div
        className="exchange-logo-bg flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md"
        style={{ '--logo-bg': exchange.bg } as React.CSSProperties}
      >
        <Image
          src={exchange.logo}
          alt={exchange.name}
          width={28}
          height={28}
          className="object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="nowrap text-base font-bold tracking-[-0.01em] text-ink">
          {exchange.name}
        </div>
        <div className="nowrap text-xs text-muted">{exchange.sub}</div>
      </div>
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-good-soft">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 8L7 11L12 5"
            stroke="rgb(var(--good))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </HoverCard>
  );
}

function ComingSoonCard({ exchange }: { exchange: Exchange }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-md border border-dashed border-line bg-card px-3 py-5 opacity-90">
      <div
        className="exchange-logo-bg flex h-10 w-10 items-center justify-center rounded-[10px]"
        style={{ '--logo-bg': exchange.bg } as React.CSSProperties}
      >
        <Image
          src={exchange.logo}
          alt={exchange.name}
          width={22}
          height={22}
          className="object-contain"
        />
      </div>
      <div className="nowrap text-[13px] font-semibold tracking-[-0.01em] text-ink">
        {exchange.name}
      </div>
    </div>
  );
}

export function Exchanges() {
  const live = exchanges.filter((e) => e.status === 'live');
  const soon = exchanges.filter((e) => e.status === 'soon');

  return (
    <section id="exchanges" className="section-pad">
      <div className="mx-auto max-w-content">
        <div className="mb-14 text-center">
          <SectionEyebrow>SUPPORTED EXCHANGES</SectionEyebrow>
          <h2 className="mb-4 text-[32px] font-extrabold leading-[1.15] tracking-tighter3 text-ink lg:text-[44px]">
            국내외 주요 거래소 지원
          </h2>
          <p className="mx-auto max-w-[580px] text-[17px] leading-[1.6] text-muted">
            초기 출시 시 2개 거래소. 매월 새 거래소가 추가됩니다.
          </p>
        </div>

        {/* LIVE group */}
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-center gap-2.5">
            <StatusPillLive />
            <span className="nowrap text-[13px] text-muted">지금 바로 사용 가능</span>
          </div>
          <div className="mx-auto grid max-w-[600px] grid-cols-1 gap-4 lg:grid-cols-2">
            {live.map((e) => (
              <LiveCard key={e.name} exchange={e} />
            ))}
          </div>
        </div>

        {/* COMING SOON group */}
        <div>
          <div className="mb-4 flex items-center justify-center gap-2.5">
            <StatusPillSoon />
            <span className="nowrap text-[13px] text-muted">2026년 7월 ~ 9월 순차 추가</span>
          </div>
          <div className="mx-auto flex max-w-[880px] flex-wrap justify-center gap-3">
            {soon.map((e) => (
              <div
                key={e.name}
                className="w-[calc(50%-6px)] md:w-[calc(25%-9px)]"
              >
                <ComingSoonCard exchange={e} />
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12.5px] text-muted-2">
            요청하시는 거래소가 있다면{' '}
            <a
              className="text-brand underline"
              href="mailto:support@kontaxt.kr?subject=거래소 추가 요청"
            >
              알려주세요
            </a>{' '}
            · 평균 2주 내 추가
          </p>
        </div>
      </div>
    </section>
  );
}
