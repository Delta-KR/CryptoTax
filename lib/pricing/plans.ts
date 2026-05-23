// 가격 단일 source.
//
// 확정 가격 전략 (2026-05-21): `pricing-strategy-summary.md` Section 6 + Obsidian
// Daily/2026-05-21.md §7. 원타임 ₩49,900 / 구독 ₩89,000 (1.8× 갭) / paywall =
// PDF 다운로드 / 결제 PG = 포트원. MVP는 원타임만 노출 (구독은 Phase 2: 2026.7~9월
// 이후). 무료는 유입 퍼널로 유지.
//
// 가격 변경 시 sync 필요한 곳:
// - app/layout.tsx JSON-LD offers
// - app/(app)/tax/page.tsx PremiumBanner 카피
// - app/(marketing)/legal/terms/page.tsx 이용약관
// - components/sections/pricing.tsx 랜딩 카드 (가격은 여기서 가져다 쓸 것)

export type PlanId = 'free' | 'premium' | 'onetime';

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  /** JSON-LD / 결제 계산용 정수 (원). free = 0. */
  priceKRW: number;
  billing: string;
  features: readonly string[];
}

export const plans: readonly Plan[] = [
  {
    id: 'free',
    name: '무료',
    price: '₩0',
    priceKRW: 0,
    billing: '영구 무료',
    features: [
      '모든 거래소 파일 업로드',
      '총 양도차익 미리보기',
      '계산 흐름 / 거래 내역 확인',
      '결제 전 결과 검증',
    ],
  },
  {
    id: 'onetime',
    name: '단일 과세연도',
    price: '₩49,900',
    priceKRW: 49_900,
    billing: '1개 연도 · 영구 접근',
    features: [
      '선택한 1개 과세연도 결과 열람',
      '해당 연도 PDF 리포트 무제한 다운로드',
      '모든 거래소 무제한',
      '의제취득가액 자동 적용',
      '코인별 손익 상세',
      'FIFO / 이동평균 비교',
    ],
  },
  {
    id: 'premium',
    name: '구독',
    price: '₩89,000',
    priceKRW: 89_000,
    billing: '/ 년 · 모든 과세연도',
    features: [
      '원타임 기능 전부 포함',
      '모든 과세연도(과거·현재·미래) 무제한',
      '구독 해지 후에도 기존 PDF 영구 다운로드',
      '상시 실현 손익 대시보드',
      'Tax-Loss Harvesting 알림',
      '의제취득가액 최적화 시뮬레이션',
      '거래소 API 자동 연동 (파일 업로드 불필요)',
      '이메일 우선 지원',
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  const plan = plans.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan id: ${id}`);
  return plan;
}
