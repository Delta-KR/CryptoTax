import {
  SectionEyebrow,
  SectionTitle,
  SectionLead,
} from '@/components/ui/section-heading';

// 가치 앵커 3층 — pricing-strategy §6.2. 세무사 비용·가산세·시간을 한 화면에
// 동시 노출해 ₩49,900 WTP 를 끌어올린다 (단일 앵커만으론 WTP 미달). loss
// aversion(가산세)이 가장 강력해 가운데에 두고 숫자만 bad 톤으로 절제 강조한다
// — 공포 마케팅 톤은 VOICE.md 금지라 카드 구조·배경은 나머지와 동일하게 유지.
// 각 카드는 비용(문제) → brand 화살표로 Kontaxt 해결을 대비시킨다.

interface AnchorCard {
  amount: string;
  amountTone: 'ink' | 'bad';
  label: string;
  body: string;
  solve: string;
}

const CARDS: readonly AnchorCard[] = [
  {
    amount: '20~50만원',
    amountTone: 'ink',
    label: '세무사 대리 신고',
    body: '가상자산 양도세를 세무사에 맡기면 신고 건당 20~50만원이 들어요.',
    solve: '직접 정리하면 그대로 아껴요.',
  },
  {
    amount: '20~40%',
    amountTone: 'bad',
    label: '무신고·과소신고 가산세',
    body: '신고가 틀리거나 빠지면 산출세액에 가산세가 붙어요. 납부까지 늦으면 연 8%씩 더 쌓여요.',
    solve: '총평균법으로 정확히 계산해서 가산세를 피해요.',
  },
  {
    amount: '반나절',
    amountTone: 'ink',
    label: '거래소별 수작업',
    body: '거래소마다 형식·날짜·통화가 달라요. 손으로 맞추다 보면 반나절이 들어요.',
    solve: 'Kontaxt 는 몇 분이면 끝나요.',
  },
];

export function ValueAnchor() {
  return (
    <section id="cost" className="section-pad">
      <div className="mx-auto max-w-content">
        <SectionEyebrow>WHY KONTAXT</SectionEyebrow>
        <SectionTitle>
          미룬다고 비용이 줄진 않아요.
          <br />
          <span className="text-muted">오히려 세 군데서 늘어나요.</span>
        </SectionTitle>
        <SectionLead>
          세무사 비용, 가산세, 그리고 시간. 직접 정리하면 다 아낄 수 있어요.
        </SectionLead>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.label}
              className="flex flex-col rounded-[14px] border border-line bg-card p-6 shadow-sm sm:p-7"
            >
              <div
                className={
                  'num nowrap text-[34px] font-extrabold leading-none tracking-tightish sm:text-[40px] ' +
                  (c.amountTone === 'bad' ? 'text-bad' : 'text-ink')
                }
              >
                {c.amount}
              </div>
              <div className="mt-3 text-[13px] font-semibold text-muted">
                {c.label}
              </div>
              <p className="mt-2 flex-1 text-[15px] leading-[1.6] text-ink-2 text-pretty">
                {c.body}
              </p>
              <div className="mt-5 flex items-center gap-2 border-t border-line-2 pt-3.5 text-[14px] font-semibold text-brand">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="flex-shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10m0 0L9 4m4 4L9 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {c.solve}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
