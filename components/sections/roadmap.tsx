import { HoverCard } from '@/components/ui/HoverCard';
import { Pill } from '@/components/ui/Pill';
import { SectionEyebrow } from '@/components/ui/section-heading';

type StepTone = 'good' | 'brand' | 'neutral';

interface Step {
  id: string;
  index: string;
  when: string;
  tone: StepTone;
  title: string;
  items: readonly string[];
  highlighted?: boolean;
}

const STEPS: readonly Step[] = [
  {
    id: 'now',
    index: '01',
    when: '지금 사용 가능',
    tone: 'good',
    title: '핵심 엔진 가동 중',
    items: [
      'Upbit / Binance 거래내역 자동 분석',
      '한국 양도세 자동 계산 (250만원 공제 · 22%)',
      '의제취득가액 자동 적용',
      '신고용 PDF 리포트 다운로드',
    ],
  },
  {
    id: 'soon',
    index: '02',
    when: '곧 출시',
    tone: 'brand',
    title: '유료 플랜 정식 출시',
    items: [
      '단일 과세연도 / 정기 구독 결제',
      '이메일 알림 (가입 · 결제 · 신고 시즌)',
    ],
  },
  {
    id: 'h2',
    index: '03',
    when: '2026 하반기',
    tone: 'neutral',
    title: '절세 시뮬레이터',
    items: [
      '연말 손실 정리 시뮬레이션 — 세금이 얼마나 달라지는지 미리 확인',
      '거래소 API 자동 연동 (파일 업로드 없이 실시간 반영)',
      '빗썸 지원 (거래내역 추출 방식 확보 시)',
    ],
  },
  {
    id: 'launch',
    index: '04',
    when: '2027.01.01 시행',
    tone: 'brand',
    title: '한국 양도세 정식 시행',
    items: [
      '첫 신고 시즌: 2028년 5월',
      '의제취득가액(2026.12.31 기준 시가) 정확도를 위해 데이터 축적은 지금부터',
    ],
    highlighted: true,
  },
];

function StepCard({ step }: { step: Step }) {
  const h = step.highlighted ?? false;
  return (
    <HoverCard
      className={
        'relative flex h-full flex-col rounded-[18px] border p-6 ' +
        (h ? '' : 'border-line bg-card shadow-sm')
      }
      style={
        h
          ? {
              background: 'linear-gradient(165deg, #1E3A8A 0%, #0F1B3D 100%)',
              borderColor: '#1E3A8A',
              color: '#fff',
              boxShadow: '0 24px 48px -12px rgba(30,58,138,0.45)',
            }
          : undefined
      }
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <span
          className={
            'num text-[28px] font-extrabold leading-none tracking-tighter3 ' +
            (h ? 'text-white/85' : 'text-brand')
          }
        >
          {step.index}
        </span>
        {h ? (
          <span className="nowrap inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[11px] font-semibold tracking-[0.02em] text-white">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white" />
            {step.when}
          </span>
        ) : (
          <Pill tone={step.tone} dot size="sm">
            {step.when}
          </Pill>
        )}
      </div>

      <h3
        className={
          'mb-4 text-[18px] font-bold leading-[1.3] tracking-tightish ' +
          (h ? 'text-white' : 'text-ink')
        }
      >
        {step.title}
      </h3>

      <ul className="flex flex-1 list-none flex-col gap-2.5">
        {step.items.map((item) => (
          <li
            key={item}
            className={
              'flex items-start gap-2 text-[13px] leading-[1.55] ' +
              (h ? 'text-white/85' : 'text-ink-2')
            }
          >
            <span
              className={
                'mt-[7px] h-1 w-1 flex-shrink-0 rounded-full ' +
                (h ? 'bg-white/60' : 'bg-muted-2')
              }
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </HoverCard>
  );
}

export function Roadmap() {
  return (
    <section id="roadmap" className="section-pad">
      <div className="mx-auto max-w-content">
        <div className="mb-10 text-center">
          <SectionEyebrow>ROADMAP</SectionEyebrow>
          <h2 className="mb-4 text-[32px] font-extrabold leading-[1.15] tracking-tighter3 text-ink lg:text-[44px]">
            지금 시작해야 하는 이유
          </h2>
          <p className="mx-auto max-w-[640px] text-[17px] leading-[1.6] text-muted">
            2027년 1월 1일부터 한국에서 가상자산 양도소득세가 시행됩니다.
            첫 신고는 2028년 5월. 그 사이에 무엇이 어떻게 추가되는지 미리 보여드릴게요.
          </p>
        </div>

        <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-stretch gap-4 lg:grid-cols-4 lg:gap-5">
          {STEPS.map((step) => (
            <StepCard key={step.id} step={step} />
          ))}
        </div>

        <p className="mt-8 text-center text-[12.5px] text-muted-2">
          일정은 진행 상황에 따라 조정될 수 있어요 · 본 정보는 세무 조언이 아닙니다
        </p>
      </div>
    </section>
  );
}
