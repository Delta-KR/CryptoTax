// Kontaxt 단일 support 연락처 — 이메일 템플릿·발송 헬퍼 공통.
// 실제 support@kontaxt.kr 메일함이 만들어지면 env로 swap.
// (현재는 Resend 도메인에 별도 inbox 미생성 → 발송자 본인 메일로 reply 받음.)

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'deltakr@icloud.com';
