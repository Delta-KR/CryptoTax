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
        'rounded-[10px] px-2.5 py-2.5 sm:px-3.5 sm:py-3 ' +
        (isBrand
          ? 'border border-brand/20 bg-brand-faint'
          : 'border border-line-2 bg-card-2')
      }
    >
      <div className="nowrap mb-0.5 text-[10px] font-medium text-muted sm:mb-1 sm:text-[11px]">
        {label}
      </div>
      {/* 모바일에서 tracking-tightish 가 letter-spacing 너무 압축돼 글자 stroke 가
          가로로 합쳐져 strikethrough 처럼 보이는 시각 효과 회피 — tracking-normal
          기본 + sm 이상에서 tightish. text size 도 모바일은 살짝 작게. */}
      <div
        className={
          'num nowrap font-bold tracking-normal sm:tracking-tightish ' +
          valueColor +
          ' ' +
          (big ? 'text-[17px] sm:text-[22px]' : 'text-[15px] sm:text-[18px]')
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
      className="grid items-center gap-2 sm:gap-3"
      // 모바일에서 좁은 viewport — 라벨/금액 컬럼 살짝 축소.
      // sm 이상은 기존 비율 유지.
      style={{ gridTemplateColumns: '30px 1fr 72px' }}
    >
      <div className="nowrap text-[11px] font-semibold text-ink-2 sm:text-xs">{label}</div>
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
          'num nowrap text-right text-[11px] font-semibold sm:text-xs ' +
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
          alt="업비트 로고"
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

      {/* Main dashboard window — .glass adds dark-mode glass treatment.
          leading-[1.175] = Pretendard normal line-height (ascent 93.76% +
          descent 23.75%, next/font capsize). 카드 텍스트가 전부 text-[Npx]
          임의값 → line-height:normal(폰트 의존)이라, 비동기 폰트 swap 시
          fallback↔Pretendard 줄높이 차이로 카드 reflow → CLS 0.153 (2026-05-30
          모바일). 명시값으로 박아 swap 무관 줄높이 고정 → CLS 0. 시각은
          Pretendard normal 과 동일. */}
      <div className="glass relative z-20 overflow-hidden rounded-lg border border-line-2 bg-card shadow-lg leading-[1.175]">
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

        <div className="p-4 sm:p-6">
          {/* Header row */}
          <div className="mb-4 flex items-baseline justify-between sm:mb-5">
            <div>
              <div className="nowrap mb-1 text-[11px] text-muted sm:text-xs">
                2027년 귀속 · 가상자산 양도소득
              </div>
              <div className="text-[16px] font-bold tracking-tightish text-ink sm:text-[18px]">
                세금 계산 결과
              </div>
            </div>
            <div className="nowrap rounded-full border border-good/40 bg-good-soft px-2 py-0.5 text-[10px] font-semibold text-good sm:px-2.5 sm:py-1 sm:text-[11px]">
              ● 계산 완료
            </div>
          </div>

          {/* 3 stat tiles */}
          <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
            <Stat label="총 양도차익" value="+₩2,120만" tone="good" />
            <Stat label="기본공제" value="−₩250만" tone="muted" />
            <Stat label="납부세액" value="₩411만" tone="brand" big />
          </div>

          {/* Chart */}
          <div className="mb-3 rounded-md border border-line-2 bg-bg-soft px-3 py-3 sm:mb-4 sm:px-[18px] sm:py-4">
            <div className="mb-3 flex items-baseline justify-between gap-2 sm:mb-3.5">
              <div className="nowrap text-[12px] font-semibold text-ink sm:text-[13px]">
                코인별 손익
              </div>
              <div className="nowrap text-[10px] text-muted-2 sm:text-[11px]">
                세율 22% (20% + 2%)
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              {bars.map((b) => (
                <Bar key={b.label} {...b} />
              ))}
            </div>
          </div>

          {/* Footer chips */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
          <p className="mb-10 max-w-[520px] text-[18px] leading-[1.6] text-muted text-pretty">
            Upbit·Bithumb·Binance 다 한 번에. 5월엔 PDF 한 장이면 돼요.
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
