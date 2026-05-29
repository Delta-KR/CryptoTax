// Mock billing — localStorage 기반 결제 내역 / 세무사 매칭. 가격(plans/Plan/PlanId)은
// lib/pricing/plans.ts로 분리됨. 결제 트랜잭션이 실제 PG (포트원) 연동되면 이 파일도
// lib/billing/ 정식 경로로 옮길 것.
//
// 키 격리 (CSO 감사 2026-05-29): 세무사 매칭(taxpro)·결제내역(history)은 PII 를 담을 수
// 있으므로 거래 세션과 동일하게 user_id 로 스코핑한다. 단일 고정 키는 같은 브라우저에서
// 계정 전환 시 이전 사용자 데이터가 노출된다. 로그아웃 정리는 storage/session.ts
// clearAllSessions 가 `kontaxt-` 키 전체를 지우면서 함께 처리.

import { getSessionUserId } from '@/lib/storage/session';

// 구버전 단일(미격리) 키 — 격리 키 도입 전 데이터. 첫 접근 시 제거해 잔존 PII 누출 차단.
const LEGACY_UNSCOPED_KEYS = ['kontaxt-taxpro', 'kontaxt-billing-history'];

function purgeLegacyBillingKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const k of LEGACY_UNSCOPED_KEYS) {
      if (localStorage.getItem(k) !== null) localStorage.removeItem(k);
    }
  } catch {
    // private mode 등 — 무시.
  }
}

export interface PaymentRecord {
  id: string;
  date: string; // ISO
  item: string;
  amount: number; // KRW
  status: '완료' | '환불' | '대기';
  receiptUrl?: string;
}

// user 별 스코핑 키 — 미로그인(SSR/anon) 시 '-anon'. session.ts getKey() 패턴 미러.
function historyKey(): string {
  return `kontaxt-billing-history-${getSessionUserId() ?? 'anon'}`;
}

// Plan 상태는 Supabase profiles 테이블 + useCurrentUser 가 처리 — 더 이상 localStorage
// 캐시 사용 안 함. getCurrentPlan / subscribe / addPayment / PLAN_KEY 는 제거됨.

export function getPaymentHistory(): PaymentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    purgeLegacyBillingKeys();
    const raw = localStorage.getItem(historyKey());
    if (!raw) return [];
    return JSON.parse(raw) as PaymentRecord[];
  } catch {
    return [];
  }
}

// 세무사 매칭 신청
function taxProKey(): string {
  return `kontaxt-taxpro-${getSessionUserId() ?? 'anon'}`;
}
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
    purgeLegacyBillingKeys();
    const raw = localStorage.getItem(taxProKey());
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
  localStorage.setItem(taxProKey(), JSON.stringify(req));
  return req;
}
