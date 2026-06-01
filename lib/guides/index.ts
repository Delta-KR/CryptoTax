// 거래소·기능 가이드 메타 — C-S2 (GEO long-tail 흡수 + Naver "업비트 매도 선입 선출" 신호).
//
// 본문은 각 페이지 컴포넌트(app/(marketing)/guides/<slug>/page.tsx)에 있고,
// 여기에는 인덱스 카드·sitemap·cross-link 용 메타만 둔다.
//
// published: 페이지 컴포넌트가 실제 존재하는 slug만 true. sitemap/인덱스가
// published만 노출 → 페이지 없는 slug 크롤 404 방지. PR마다 해당 가이드 true 전환.
//
// 톤: VOICE.md — Guide 친밀 영역(해요체). 세무사 언급 금지([[feedback_no_tax_agent_framing]]).

export type GuideCategory = 'exchange' | 'feature';

export interface GuideMeta {
  slug: string;
  title: string; // 페이지 h1 + 인덱스 카드 제목
  summary: string; // meta description + 인덱스 카드 본문 (한 줄, 해요체)
  category: GuideCategory;
  related: string[]; // 관련 glossary term slug (cross-link)
  published: boolean;
}

export const GUIDES: readonly GuideMeta[] = [
  {
    slug: 'upbit-pdf-download',
    title: '업비트 거래내역 PDF 받는 법',
    summary:
      '업비트에서 양도소득세 신고용 거래내역 PDF를 받아 Kontaxt에 올리는 방법을 단계별로 정리했어요.',
    category: 'exchange',
    related: ['total-average-method', 'deemed-acquisition-cost'],
    published: false,
  },
  {
    slug: 'binance-csv-export',
    title: '바이낸스 거래내역 CSV 받는 법',
    summary:
      '바이낸스에서 현물(Spot) 거래내역 CSV를 내보내 Kontaxt에 올리는 방법을 단계별로 정리했어요.',
    category: 'exchange',
    related: ['total-average-method', 'necessary-expense'],
    published: false,
  },
  {
    slug: 'swap-tax-handling',
    title: '코인 교환(SWAP)은 세금이 어떻게 매겨지나요',
    summary:
      'BTC를 ETH로 바꾸는 코인 교환은 매도와 매수 2건으로 나뉘어 과세돼요. 계산 예시로 풀었어요.',
    category: 'feature',
    related: ['total-average-method', 'tax-base'],
    published: false,
  },
  {
    slug: 'usdt-fx-conversion',
    title: 'USDT 거래는 원화로 어떻게 환산되나요',
    summary:
      'USDT 같은 외화 거래는 거래 시점 환율로 원화로 환산해 손익을 계산해요. 계산 예시로 풀었어요.',
    category: 'feature',
    related: ['total-average-method', 'tax-base'],
    published: false,
  },
];

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

// sitemap·인덱스가 노출하는 slug — published만.
export const GUIDE_SLUGS: readonly string[] = GUIDES.filter(
  (g) => g.published,
).map((g) => g.slug);

// 인덱스 카드는 published 무관 전체를 카테고리별로 — 단 미published는 "준비 중" 배지.
export const GUIDES_BY_CATEGORY = {
  exchange: GUIDES.filter((g) => g.category === 'exchange'),
  feature: GUIDES.filter((g) => g.category === 'feature'),
} as const;
