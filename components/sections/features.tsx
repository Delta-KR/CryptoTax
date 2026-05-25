import { HoverCard } from '@/components/ui/HoverCard';
import { SectionEyebrow } from '@/components/ui/section-heading';

type IconName = 'compare' | 'shield' | 'globe' | 'doc';

interface BigData {
  title: string;
  desc: string;
}

interface SmallData {
  title: string;
  desc: string;
  icon: IconName;
}

const big: BigData = {
  title: '여러 거래소, 한 번에 통합',
  desc: '국내외 어떤 거래소든 파일만 올리면 자동으로 형식을 맞춰서 시간순으로 합쳐 줘요. 같은 코인을 다른 거래소로 옮긴 것도 알아서 추적해요.',
};

const items: readonly SmallData[] = [
  {
    title: '계산 방식 자동 선택',
    desc: '총평균법 (시행령 §88①) 자동 적용. 시행 전 보유분에는 의제취득가액 자동 비교.',
    icon: 'compare',
  },
  {
    title: '의제취득가액 자동 적용',
    desc: '2026년 12월 31일 이전에 사 둔 거는 그날 시가를 자동으로 조회해서 더 큰 금액으로 적용해요. 세금이 줄어들어요.',
    icon: 'shield',
  },
  {
    title: '해외 거래 환율 변환',
    desc: '바이낸스 같은 USDT 거래는 거래 시점 KRW 환율로 자동 변환해요. 한국은행 고시 환율 기준이라 정확해요.',
    icon: 'globe',
  },
  {
    title: '세무사 전달용 PDF',
    desc: '종합소득세 신고서 양식에 맞춘 항목별 정리 PDF예요. 거래 원본·계산 근거·산출 내역까지 다 들어가요.',
    icon: 'doc',
  },
];

function FeatureIcon({ name }: { name: IconName }) {
  const common = {
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  switch (name) {
    case 'compare':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 7h12M5 7l3-3M5 7l3 3M19 17H7M19 17l-3 3M19 17l-3-3"
            {...common}
          />
        </svg>
      );
    case 'shield':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l8 3v6c0 4-3.5 7.5-8 9-4.5-1.5-8-5-8-9V6l8-3z" {...common} />
          <path d="M9 12l2 2 4-4" {...common} />
        </svg>
      );
    case 'globe':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" {...common} />
        </svg>
      );
    case 'doc':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" {...common} />
          <path d="M14 3v5h5M9 13h6M9 17h4" {...common} />
        </svg>
      );
  }
}

// MVP 출시 시점 LIVE 거래소(업비트·바이낸스) 기준 예시.
// 빗썸은 거래내역 추출 방식 확보 후 추가 예정이라 mock에서 제외.
const exchangeCounts: ReadonlyArray<readonly [string, string, number]> = [
  ['업비트', '#0E48F0', 152],
  ['바이낸스', '#F0B90B', 95],
];

function FeatureBig({ data }: { data: BigData }) {
  return (
    <HoverCard className="flex min-h-[380px] flex-col justify-between overflow-hidden rounded-lg border border-line bg-card p-8 shadow-sm lg:row-span-2">
      <div>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-brand-soft text-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 17l4-4 4 4 7-7M21 7v4M21 7h-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="mb-2.5 text-[22px] font-bold tracking-tightish text-ink">
          {data.title}
        </h3>
        <p className="max-w-[360px] text-sm leading-[1.7] text-muted text-pretty">{data.desc}</p>
      </div>

      {/* 247건 visual */}
      <div className="mt-6 rounded-md border border-line bg-bg-soft px-4 py-3.5">
        <div className="mb-2.5 text-[11px] font-semibold tracking-[0.06em] text-muted-2">
          예시 통합 결과 — 247건
        </div>
        <div className="flex flex-wrap gap-1.5">
          {exchangeCounts.map(([n, c, v]) => (
            <div
              key={n}
              className="min-w-0 flex-1 rounded-sm border border-line-2 bg-card px-3 py-2.5"
              style={{ borderLeft: `3px solid ${c}` }}
            >
              <div className="text-[11px] font-medium text-muted">{n}</div>
              <div className="num text-base font-bold text-ink">
                {v}
                <span className="ml-0.5 text-[10px] font-medium text-muted-2">건</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </HoverCard>
  );
}

function FeatureCard({ data }: { data: SmallData }) {
  return (
    <HoverCard className="rounded-lg border border-line bg-card p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-soft text-brand">
        <FeatureIcon name={data.icon} />
      </div>
      <h3 className="mb-2 text-base font-bold tracking-[-0.015em] text-ink">
        {data.title}
      </h3>
      <p className="text-[13px] leading-[1.6] text-muted text-pretty">{data.desc}</p>
    </HoverCard>
  );
}

export function Features() {
  return (
    <section id="features" className="section-pad">
      <div className="mx-auto max-w-content">
        <div className="mb-14 text-center">
          <SectionEyebrow>FEATURES</SectionEyebrow>
          <h2 className="mb-4 text-[32px] font-extrabold leading-[1.15] tracking-tighter3 text-ink lg:text-[44px]">
            한국 세법, 빠짐없이.
          </h2>
          <p className="mx-auto max-w-[580px] text-[17px] leading-[1.6] text-muted">
            세무사가 검수했고, 개발자가 만들었어요. 빠지는 것 없이 정확하게.
          </p>
        </div>

        {/* Bento grid: big spans 2 rows on left, 4 small cards fill 2×2 right */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <FeatureBig data={big} />
          {items.map((item) => (
            <FeatureCard key={item.title} data={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
