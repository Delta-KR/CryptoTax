import {
  SectionEyebrow,
  SectionTitle,
  SectionLead,
} from '@/components/ui/section-heading';

// 가치 앵커 3층 — pricing-strategy §6.2. 직접 정리하면 드는 부담(공제·경비
// 누락 / 가산세 / 시간)을 한 화면에 동시 노출해 ₩49,900 WTP 를 끌어올린다.
//
// ⚠️ "세무사 비용 절감" 앵커는 의도적으로 제외했다. 세무사를 대체한다는 프레임은
// (1) 세무사법 §20(무자격 세무대리·광고 금지) 오인 소지 (2) footer·약관 §9·PDF
// 의 "참고자료 + 세무사 검토 권장" 포지셔닝과 정면 충돌. Kontaxt 는 세무대리가
// 아니라 신고 자료를 만드는 계산 도구다. 앵커는 전부 세무사 무관한 사실·기능
// 기반으로 둔다 (2026-05-31 결정).
//
// loss aversion(가산세)이 가장 강력해 가운데에 두고 숫자만 bad 톤으로 절제 강조
// — 공포 마케팅 톤은 VOICE.md 금지라 카드 구조·배경은 나머지와 동일하게 유지.
// 각 카드는 부담(문제) → brand 화살표로 Kontaxt 해결을 대비시킨다.

interface AnchorCard {
  amount: string;
  amountTone: 'ink' | 'bad';
  label: string;
  body: string;
  solve: string;
}

const CARDS: readonly AnchorCard[] = [
  {
    amount: '250만원',
    amountTone: 'ink',
    label: '기본공제·필요경비',
    body: '기본공제 250만원에 필요경비·의제취득가액까지. 거주자 세법 규칙을 손으로 다 챙기긴 어려워요.',
    solve: '세법 규칙을 자동으로 반영해서 정확히 계산해요.',
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
          복잡한 세법, 가산세, 그리고 시간. Kontaxt 로 세 가지 부담을 한 번에 줄여요.
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
