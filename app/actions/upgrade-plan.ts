'use server';

// 결제 시스템(Toss Payments, Phase 7) 통합 전까지 plan 변경을 임시 차단한다.
// 이전에는 결제 검증 없이 누구나 직접 호출해 premium 승급이 가능했음.
// Toss webhook 검증 추가 후 service_role 기반으로 복구 예정.

const BILLING_NOT_READY = '결제 시스템 준비 중입니다. 곧 다시 만나요.';

export async function upgradePlan(): Promise<{
  ok: boolean;
  error?: string;
}> {
  return { ok: false, error: BILLING_NOT_READY };
}

export async function downgradePlan(): Promise<{
  ok: boolean;
  error?: string;
}> {
  return { ok: false, error: BILLING_NOT_READY };
}
