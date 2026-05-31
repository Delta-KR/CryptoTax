// 가상자산 양도소득세 용어사전 데이터 — C-S1 (GEO 인용 토대 + Naver "선입선출" 신호).
//
// 세법 정확성 critical (사용자·LLM이 인용). 정의는 기존 검증된 표현을 차용한다:
// guide FAQ(의제취득가액) · CLAUDE.md 세법 요약 · penalty.ts 가산세율 · 엔진 주석.
// law 필드에는 코드/테스트로 확인된 조항만 단다 (legal-evidence.test 인용 조항).
//
// 톤: VOICE.md — 정보성이라 Guide 와 같은 해요체. 숫자 한국식. 세무사 언급 금지
// ([[feedback_no_tax_agent_framing]]).

export interface GlossaryTerm {
  slug: string;
  term: string; // 한글 표제어
  aka?: string; // 영문·별칭 병기
  summary: string; // 한 줄 정의 (meta description + 인덱스 카드)
  body: string[]; // 본문 단락 (해요체)
  law?: string; // 근거 법령 (확인된 조항만)
  related: string[]; // 관련 term slug
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    slug: 'total-average-method',
    term: '총평균법',
    aka: 'Total Average Method',
    summary:
      '거주자의 가상자산 취득가액을 연 단위 평균 매수가로 산정하는 한국 세법상 방식이에요.',
    body: [
      '같은 가상자산을 여러 번 나눠 사도, 1년 동안의 총 매수금액을 총 수량으로 나눈 평균 단가를 취득가액으로 써요. 소득세법 시행령 §88①·§92②4호(2025년 2월 28일 개정)가 정한 거주자 법정 방식이에요.',
      '예를 들어 비트코인을 100만원에 0.01개, 200만원에 0.01개 샀다면 평균 취득단가는 150만원이에요. 매도할 때 이 평균가를 기준으로 양도차익을 계산해요.',
      '선입선출법·이동평균법은 거주자 신고에는 쓰지 않아요. 비거주자나 참고용 계산에서만 의미가 있어요.',
    ],
    law: '소득세법 시행령 §88①·§92②4호',
    related: ['fifo', 'deemed-acquisition-cost', 'necessary-expense'],
  },
  {
    slug: 'fifo',
    term: '선입선출법',
    aka: 'FIFO · First-In-First-Out',
    summary:
      '먼저 산 가상자산부터 팔았다고 보는 취득가액 산정 방식이에요. 거주자 신고에는 쓰지 않아요.',
    body: [
      '선입선출법은 가장 먼저 취득한 수량부터 양도한 것으로 가정해 취득가액을 정하는 방식이에요.',
      '한국 거주자의 가상자산 양도소득세는 총평균법만 인정돼요(시행령 §88①). 선입선출법은 비거주자(시행령 §183⑥)나 참고용 계산에서만 써요.',
      '거래소 화면이 보여주는 선입선출 기준 손익과, 실제로 신고할 총평균법 손익은 다를 수 있어요. 신고는 총평균법 결과로 해야 해요.',
    ],
    law: '거주자 부적용 · 비거주자 시행령 §183⑥',
    related: ['total-average-method'],
  },
  {
    slug: 'deemed-acquisition-cost',
    term: '의제취득가액',
    aka: 'Deemed Acquisition Cost',
    summary:
      '2026년 12월 31일 이전에 산 가상자산의 취득가액을 실제 매수가와 시행 직전 시가 중 큰 값으로 보는 규칙이에요.',
    body: [
      '2026년 12월 31일 이전에 취득한 가상자산은 취득가액을 "실제 매수 가격"과 "2026년 12월 31일 기준 시가" 중 더 큰 값으로 적용해요.',
      '한국 가상자산 과세가 시행되는 2027년 1월 1일 전에 산 자산을 보호하는 장치예요. 시행 전의 가격 상승분에는 과세하지 않으려는 취지죠.',
      '취득 시점이나 가격을 증빙하기 어려운 경우에도 이 규정이 적용돼서, 시가 기준으로 취득가액을 인정받을 수 있어요.',
    ],
    law: '소득세법 시행령 §88②',
    related: ['total-average-method', 'necessary-expense'],
  },
  {
    slug: 'necessary-expense',
    term: '필요경비',
    aka: 'Necessary Expense',
    summary: '양도차익을 계산할 때 양도가액에서 빼주는 취득가액과 부대비용이에요.',
    body: [
      '양도차익은 판 금액(양도가액)에서 필요경비를 뺀 값이에요. 필요경비에는 취득가액과 거래 수수료 등이 들어가요.',
      '가상자산은 총평균법으로 구한 평균 취득가액이 필요경비의 핵심이에요. 취득가액을 확인하기 어려우면 시행령에 따라 의제 방식을 적용해요.',
    ],
    law: '소득세법 시행령 §88⑤',
    related: ['total-average-method', 'deemed-acquisition-cost', 'tax-base'],
  },
  {
    slug: 'basic-deduction',
    term: '기본공제',
    aka: 'Basic Deduction',
    summary: '가상자산 양도소득에서 매년 250만원을 빼주는 공제예요.',
    body: [
      '가상자산 양도소득은 1년에 250만원까지 공제받아요. 연간 양도차익에서 이 금액을 뺀 나머지가 과세 대상이에요.',
      '예를 들어 한 해 양도차익이 300만원이면, 250만원을 뺀 50만원에만 세금이 매겨져요. 양도차익이 250만원 이하면 낼 세금이 없어요.',
    ],
    law: '소득세법 §64의3②',
    related: ['tax-base', 'other-income'],
  },
  {
    slug: 'tax-base',
    term: '과세표준',
    aka: 'Tax Base',
    summary: '세율을 곱하는 기준 금액이에요. 양도차익에서 기본공제를 뺀 값이에요.',
    body: [
      '과세표준은 실제로 세율을 곱하는 기준 금액이에요. 한 해 양도차익(손익을 합산한 뒤)에서 기본공제 250만원을 뺀 금액이에요.',
      '여기에 세율 22%(소득세 20% + 지방소득세 2%)를 곱하면 납부할 세액이 나와요.',
    ],
    related: ['basic-deduction', 'other-income', 'necessary-expense'],
  },
  {
    slug: 'other-income',
    term: '기타소득 분리과세',
    aka: 'Separate Taxation',
    summary: '가상자산 양도소득은 기타소득으로 분류돼 22%로 따로 과세돼요.',
    body: [
      '한국 세법은 가상자산 양도소득을 기타소득으로 분류해요. 다른 소득과 합치지 않고 따로 과세하는 분리과세 방식이에요.',
      '세율은 22%예요 — 소득세 20%에 지방소득세 2%가 더해져요. 종합소득에 합산되지 않아서, 다른 소득이 많아도 가상자산 세율이 올라가지 않아요.',
    ],
    related: ['tax-base', 'penalty-tax'],
  },
  {
    slug: 'penalty-tax',
    term: '가산세',
    aka: 'Penalty Tax',
    summary:
      '신고를 안 하거나 적게 하면 붙는 추가 세금이에요. 무신고 20%, 과소신고 10% 등이에요.',
    body: [
      '정해진 기한에 신고하지 않으면 무신고 가산세가 산출세액의 20%(부정한 방법이면 40%) 붙어요.',
      '실제보다 적게 신고하면 과소신고 가산세 10%(부정 40%)가 붙어요. 납부까지 늦으면 납부지연 가산세가 하루 0.022%(연 약 8%)씩 더해져요.',
      '제때 정확히 신고하면 이런 가산세를 내지 않아요.',
    ],
    law: '국세기본법 §47의2·§47의3·§47의4',
    related: ['tax-base', 'other-income'],
  },
];

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug);
}

export const GLOSSARY_SLUGS: readonly string[] = GLOSSARY.map((t) => t.slug);
