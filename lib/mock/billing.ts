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
    features: ['1개 거래소 연동', '연 100건 거래까지', '기본 세금 계산', 'PDF 리포트 1회'],
  },
  {
    id: 'premium',
    name: '프리미엄',
    price: '₩19,900',
    billing: '/ 년',
    features: [
      '모든 거래소 무제한',
      '거래 무제한',
      '선입선출 / 이동평균법',
      '의제취득가액 자동',
      '세무사 전달용 PDF',
      '이메일 우선 지원',
    ],
  },
  {
    id: 'onetime',
    name: '원타임',
    price: '₩29,900',
    billing: '신고 시즌 1회',
    features: ['프리미엄 기능 전체', '5월~6월 30일간', '단 한 번의 정산', '구독 부담 없음'],
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
