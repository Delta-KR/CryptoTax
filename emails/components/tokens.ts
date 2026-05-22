// Kontaxt 이메일 디자인 토큰 — DESIGN.md의 토큰을 인라인 hex로 변환.
// 이메일 클라이언트는 CSS 변수 미지원이므로 모든 색상은 리터럴 hex.
//
// 새 디자인 (2026-05-23, Claude Design 핸드오프) 기준으로 정리:
// 색감은 brand blue 단일 액센트, 라이트/다크 모두 자연스러운 카드 위계.

export const colors = {
  // Brand
  brand: '#2563EB',
  brandDark: '#6BA1FF',

  // 라이트 모드 surface
  bg: '#FAFBFD',
  cardBg: '#FFFFFF',
  cardBorder: '#E6EAF0',

  // 라이트 모드 ink
  ink: '#0B1220',
  ink2: '#1F2937',
  muted: '#5C6678',
  muted2: '#8A93A4',

  // 다크 모드 surface
  darkBg: '#0B1220',
  darkCardBg: '#0F172A',
  darkCardBorder: '#1F2937',

  // 다크 모드 ink
  darkInk: '#F5F7FA',
  darkInk2: '#D6DBE4',
  darkMuted: '#8A93A4',
  darkMuted2: '#6B7385',
} as const;

// 폰트 스택 — Pretendard 우선, 시스템 폰트 폴백.
// Gmail 등 일부 클라이언트는 외부 폰트를 차단하므로 폴백이 핵심.
export const fontStack =
  "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', " +
  "'Malgun Gothic', '맑은 고딕', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const monoStack =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// 레이아웃
export const layout = {
  containerMaxWidth: 520,
  cardRadius: 16,
  buttonRadius: 10,
} as const;
