import Image from 'next/image';
import Link from 'next/link';
import { getDaysUntilTaxStart } from '@/lib/dday';

// Hero — pixel-matched to design/parts/hero.jsx.
// Sub-components are file-private (Badge / Check / Stat / Bar / Chip /
// FloatingCard*). Promoted to components/ui/ when reused by other sections.

function Badge() {
  const dday = getDaysUntilTaxStart();
  return (
    <div className="nowrap inline-flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1 text-[11px] font-medium text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
      2027.01.01 시행 · D-{dday}
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <span className="nowrap inline-flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="rgb(var(--good-soft))" />
        <path
          d="M5 8.5L7 10.5L11 6"
          stroke="rgb(var(--good))"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </span>
  );
}

interface StatProps {
  label: string;
  value: string;
  tone: 'good' | 'bad' | 'brand' | 'muted';
  big?: boolean;
}

function Stat({ label, value, tone, big }: StatProps) {
  const valueColor = {
    good: 'text-good',
    bad: 'text-bad',
    brand: 'text-brand',
    muted: 'text-ink-2',
  }[tone];
  const isBrand = tone === 'brand';

  return (
    <div
      className={
        'rounded-[10px] px-3.5 py-3 ' +
        (isBrand
          ? 'border border-brand/20 bg-brand-faint'
          : 'border border-line-2 bg-card-2')
      }
    >
      <div className="nowrap mb-1 text-[11px] font-medium text-muted">{label}</div>
      <div
        className={
          'num nowrap font-bold tracking-tightish ' +
          valueColor +
          ' ' +
          (big ? 'text-[22px]' : 'text-[18px]')
        }
      >
        {value}
      </div>
    </div>
  );
}

interface BarProps {
  label: string;
  amount: string;
  pct: number;
  gain: boolean;
}

function Bar({ label, amount, pct, gain }: BarProps) {
  return (
    <div
      className="grid items-center gap-3"
      style={{ gridTemplateColumns: '36px 1fr 90px' }}
    >
      <div className="nowrap text-xs font-semibold text-ink-2">{label}</div>
      <div className="relative h-2.5 rounded-[6px] border border-line-2 bg-bg-tint">
        <div
          className="absolute inset-y-0 left-0 rounded-[6px]"
          style={{
            width: `${pct}%`,
            background: gain
              ? 'linear-gradient(90deg, rgb(var(--brand-light)), rgb(var(--brand)))'
              : 'linear-gradient(90deg, rgb(var(--bad-light)), rgb(var(--bad)))',
          }}
        />
      </div>
      <div
        className={
          'num nowrap text-right text-xs font-semibold ' +
          (gain ? 'text-good' : 'text-bad')
        }
      >
        {amount}
      </div>
    </div>
  );
}

function Chip({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={
        'nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ' +
        (light
          ? 'border border-line-2 bg-bg-tint text-muted'
          : 'border bg-brand-soft text-brand-2')
      }
      style={light ? undefined : { borderColor: 'rgb(var(--brand) / 0.2)' }}
    >
      {children}
    </span>
  );
}

// Floating ambient cards — absolutely positioned around the dashboard.
// Hidden ≤768px (md breakpoint).
function FloatingCardUpbit() {
  return (
    <div className="nowrap absolute -top-14 right-6 z-30 hidden items-center gap-2.5 rounded-md border border-line-2 bg-card px-3.5 py-3 shadow-md md:flex">
      {/* brand-soft 토큰 사용 — 다크 모드에서 자동 어두운 톤으로 매핑됨. */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm bg-brand-soft">
        <Image
          src="/logos/upbit.png"
          alt="업비트"
          width={20}
          height={20}
          className="object-contain"
        />
      </div>
      <div>
        <div className="text-xs text-muted">업비트 거래내역</div>
        <div className="text-[13px] font-semibold text-ink">upbit_2027.pdf · 통합 완료</div>
      </div>
      <div className="ml-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-good-soft">
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
    </div>
  );
}

function FloatingCardPDF() {
  return (
    <div className="nowrap absolute -bottom-7 -right-4 z-30 hidden min-w-[200px] rounded-md border border-line-2 bg-card px-4 py-3.5 shadow-md md:block">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-2">
        2027 신고용 PDF
      </div>
      <div className="mb-1.5 text-sm font-semibold text-ink">tax_report_홍길동.pdf</div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="h-2 w-2 rounded-full bg-good" />
        세무사 전달 가능
      </div>
    </div>
  );
}

function DashboardMock() {
  const bars: BarProps[] = [
    { label: 'BTC', amount: '+2,000만', pct: 100, gain: true },
    { label: 'ETH', amount: '-300만', pct: 15, gain: false },
    { label: 'SOL', amount: '+300만', pct: 15, gain: true },
    { label: 'XRP', amount: '+120만', pct: 6, gain: true },
  ];

  return (
    <div className="relative">
      <FloatingCardUpbit />
      <FloatingCardPDF />

      {/* Main dashboard window — .glass adds dark-mode glass treatment */}
      <div className="glass relative z-20 overflow-hidden rounded-lg border border-line-2 bg-card shadow-lg">
        {/* macOS chrome — skeuomorphic OS dots (DESIGN.md §3 exception:
            depicting native OS controls, not brand color). Keep hex literal. */}
        <div className="flex items-center justify-between border-b border-line-2 bg-bg-soft px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FF5F56' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#27C93F' }} />
          </div>
          <div className="nowrap text-xs text-muted-2">2027 dashboard</div>
          <div className="w-[30px]" />
        </div>

        <div className="p-6">
          {/* Header row */}
          <div className="mb-5 flex items-baseline justify-between">
            <div>
              <div className="nowrap mb-1 text-xs text-muted">
                2027년 귀속 · 가상자산 양도소득
              </div>
              <div className="text-[18px] font-bold tracking-tightish text-ink">
                세금 계산 결과
              </div>
            </div>
            <div className="nowrap rounded-full border border-good/40 bg-good-soft px-2.5 py-1 text-[11px] font-semibold text-good">
              ● 계산 완료
            </div>
          </div>

          {/* 3 stat tiles */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Stat label="총 양도차익" value="+₩2,120만" tone="good" />
            <Stat label="기본공제" value="−₩250만" tone="muted" />
            <Stat label="납부세액" value="₩411만" tone="brand" big />
          </div>

          {/* Chart */}
          <div className="mb-4 rounded-md border border-line-2 bg-bg-soft px-[18px] py-4">
            <div className="mb-3.5 flex items-baseline justify-between gap-2">
              <div className="nowrap text-[13px] font-semibold text-ink">코인별 손익</div>
              <div className="nowrap text-[11px] text-muted-2">세율 22% (20% + 2%)</div>
            </div>
            <div className="flex flex-col gap-2.5">
              {bars.map((b) => (
                <Bar key={b.label} {...b} />
              ))}
            </div>
          </div>

          {/* Footer chips */}
          <div className="flex flex-wrap gap-2">
            <Chip>총평균법</Chip>
            <Chip>의제취득가액 적용</Chip>
            <Chip>3개 거래소 통합</Chip>
            <Chip light>247건 거래</Chip>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="section-pad-hero">
      <div className="mx-auto grid max-w-content items-center gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        {/* Copy */}
        <div>
          <Badge />
          <h1 className="mb-7 mt-7 text-[40px] font-extrabold leading-[1.05] tracking-tightest text-ink lg:text-[68px]">
            내 가상자산 양도세,
            <br />
            <span className="text-brand">한 번에 정리해요.</span>
          </h1>
          <p className="mb-10 max-w-[520px] text-[18px] leading-[1.6] text-muted">
            Upbit·Bithumb·Binance 다 한 번에. 5월 신고할 때 PDF 한 장만 챙기면 돼요.
          </p>

          <div className="mb-7 flex flex-wrap items-center gap-2.5">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-6 py-4 text-[15px] font-semibold tracking-[-0.005em] text-white transition-colors hover:bg-brand-2"
            >
              무료로 시작하기
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8h10m0 0L9 4m4 4L9 12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/sample"
              className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-card px-5 py-[15px] text-[15px] font-medium tracking-[-0.005em] text-ink-2 transition-colors hover:bg-bg-soft"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 2h5l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path
                  d="M9 2v3h3M6 9h4M6 11.5h4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              샘플 리포트 보기
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted-2">
            <Check>신용카드 필요 없어요</Check>
            <Check>결과 먼저 보고 결정</Check>
            <Check>2분이면 끝</Check>
          </div>
        </div>

        {/* Right column */}
        <DashboardMock />
      </div>
    </section>
  );
}
