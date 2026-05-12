// Mock billing — localStorage 기반 plan + 결제 내역.

export type PlanId = 'free' | 'premium' | 'onetime';

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  billing: string;
  features: readonly string[];
}

export const plans: readonly Plan[] = [
  {
    id: 'free',
    name: '무료',
    price: '₩0',
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
    price: '₩29,900',
    billing: '1개 연도 · 영구 접근',
    features: [
      '선택한 1개 과세연도 결과 열람',
      '해당 연도 PDF 리포트 무제한 다운로드',
      '모든 거래소 무제한',
      '의제취득가액 자동 적용',
      '코인별 손익 상세',
    ],
  },
  {
    id: 'premium',
    name: '구독',
    price: '₩19,900',
    billing: '/ 년 · 모든 과세연도',
    features: [
      '모든 과세연도 무제한 계산',
      'PDF 리포트 무제한 생성',
      '구독 해지 후에도 기존 PDF 영구 다운로드',
      '모든 거래소 무제한',
      '의제취득가액 자동 적용',
      '이메일 우선 지원',
    ],
  },
];

export interface PaymentRecord {
  id: string;
  date: string; // ISO
  item: string;
  amount: number; // KRW
  status: '완료' | '환불' | '대기';
  receiptUrl?: string;
}

const PLAN_KEY = 'crypto-tax-plan';
const HISTORY_KEY = 'crypto-tax-billing-history';

export function getCurrentPlan(): PlanId {
  if (typeof window === 'undefined') return 'free';
  const v = localStorage.getItem(PLAN_KEY);
  if (v === 'premium' || v === 'onetime') return v;
  return 'free';
}

export function subscribe(plan: PlanId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAN_KEY, plan);
  // 결제 기록 추가
  const target = plans.find((p) => p.id === plan);
  if (target && plan !== 'free') {
    const amount = plan === 'premium' ? 19900 : 29900;
    addPayment({
      item: `${target.name} 플랜 결제`,
      amount,
      status: '완료',
    });
  }
}

export function getPaymentHistory(): PaymentRecord[] {
  if (typeof window === 'undefined') return defaultHistory;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return defaultHistory;
    return JSON.parse(raw) as PaymentRecord[];
  } catch {
    return defaultHistory;
  }
}

function addPayment(p: Omit<PaymentRecord, 'id' | 'date'>) {
  if (typeof window === 'undefined') return;
  const existing = getPaymentHistory();
  const next: PaymentRecord[] = [
    {
      id: `pay_${Date.now()}`,
      date: new Date().toISOString(),
      receiptUrl: '#',
      ...p,
    },
    ...existing,
  ];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

// 기본 결제 내역 (mock — 처음 방문 시 표시)
const defaultHistory: PaymentRecord[] = [];

// 세무사 매칭 신청
const TAXPRO_KEY = 'crypto-tax-taxpro';
export interface TaxProRequest {
  id: string;
  name: string;
  contact: string;
  preferredPeriod: string;
  notes: string;
  status: '매칭 대기' | '매칭 완료';
  submittedAt: string;
}

export function getTaxProRequest(): TaxProRequest | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TAXPRO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TaxProRequest;
  } catch {
    return null;
  }
}

export function submitTaxProRequest(
  data: Omit<TaxProRequest, 'id' | 'status' | 'submittedAt'>
): TaxProRequest {
  const req: TaxProRequest = {
    id: `tp_${Date.now()}`,
    status: '매칭 대기',
    submittedAt: new Date().toISOString(),
    ...data,
  };
  localStorage.setItem(TAXPRO_KEY, JSON.stringify(req));
  return req;
}
