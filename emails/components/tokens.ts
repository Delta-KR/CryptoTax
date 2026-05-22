/**
 * Kontaxt 이메일 디자인 토큰
 *
 * DESIGN.md의 컬러·타이포 토큰을 이메일 클라이언트가 이해할 수 있도록
 * inline hex / px 단위로 고정한 버전. 웹앱과 1:1 매칭.
 *
 * 이메일 클라이언트는 CSS 변수, rem, 일부 modern CSS를 지원하지 않으므로
 * 절대 단위와 hex만 사용한다.
 */

export const colors = {
  // Brand
  brand: '#2563EB',
  brand2: '#1D4ED8',
  brandSoft: '#EEF4FF',
  brandFaint: '#F5F8FF',

  // Text
  ink: '#0B1220',
  ink2: '#1F2937',
  muted: '#5C6678',
  muted2: '#8A93A4',

  // Surface
  bg: '#FFFFFF',
  bgSoft: '#FAFBFD',
  bgTint: '#F4F7FB',
  card: '#FFFFFF',

  // Border
  line: '#E6EAF0',
  line2: '#EEF1F6',

  // Semantic
  good: '#16A34A',
  goodSoft: '#ECFDF5',
  bad: '#DC2626',
  badSoft: '#FEF2F2',
  warn: '#D97706',
  warnSoft: '#FFFBEB',
} as const;

/**
 * 폰트 스택 — Pretendard 우선, 시스템 폰트 폴백.
 * Gmail 등 일부 클라이언트는 외부 폰트를 차단하므로 폴백이 핵심.
 */
export const fontStack =
  "Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', " +
  "'Malgun Gothic', '맑은 고딕', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const monoStack =
  "'JetBrains Mono', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

/**
 * Type Scale — 이메일은 폰트 사이즈가 작으면 모바일에서 깨지므로
 * 웹앱보다 살짝 크게 잡는다.
 */
export const type = {
  // Heading
  h1: {
    fontSize: '24px',
    lineHeight: '1.3',
    letterSpacing: '-0.02em',
    fontWeight: 700,
    color: colors.ink,
  },
  h2: {
    fontSize: '18px',
    lineHeight: '1.4',
    letterSpacing: '-0.015em',
    fontWeight: 600,
    color: colors.ink,
  },
  eyebrow: {
    fontSize: '11px',
    lineHeight: '1',
    letterSpacing: '0.16em',
    fontWeight: 700,
    color: colors.brand,
    textTransform: 'uppercase' as const,
  },
  // Body
  body: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: colors.ink2,
  },
  bodyMuted: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: colors.muted,
  },
  // Bilingual EN
  bodyEn: {
    fontSize: '13px',
    lineHeight: '1.55',
    color: colors.muted,
    fontStyle: 'normal' as const,
  },
  small: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: colors.muted2,
  },
  // OTP / monospace
  otp: {
    fontFamily: monoStack,
    fontSize: '32px',
    lineHeight: '1.2',
    letterSpacing: '0.18em',
    fontWeight: 700,
    color: colors.ink,
  },
} as const;

export const spacing = {
  containerMaxWidth: '560px',
  sectionPaddingY: '32px',
  sectionPaddingX: '32px',
  sectionPaddingMobile: '20px',
  cardPadding: '24px',
  stackSm: '8px',
  stackMd: '16px',
  stackLg: '24px',
  stackXl: '32px',
} as const;

export const radius = {
  card: '12px',
  button: '10px',
  pill: '999px',
} as const;
