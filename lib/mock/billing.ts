// Mock billing — localStorage 기반 결제 내역 / 세무사 매칭. 가격(plans/Plan/PlanId)은
// lib/pricing/plans.ts로 분리됨. 결제 트랜잭션이 실제 PG (포트원) 연동되면 이 파일도
// lib/billing/ 정식 경로로 옮길 것.

export interface PaymentRecord {
  id: string;
  date: string; // ISO
  item: string;
  amount: number; // KRW
  status: '완료' | '환불' | '대기';
  receiptUrl?: string;
}

const HISTORY_KEY = 'kontaxt-billing-history';

// Plan 상태는 Supabase profiles 테이블 + useCurrentUser 가 처리 — 더 이상 localStorage
// 캐시 사용 안 함. getCurrentPlan / subscribe / addPayment / PLAN_KEY 는 제거됨.

export function getPaymentHistory(): PaymentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PaymentRecord[];
  } catch {
    return [];
  }
}

// 세무사 매칭 신청
const TAXPRO_KEY = 'kontaxt-taxpro';
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
