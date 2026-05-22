// Kontaxt 워드마크 로고 — 외부 URL 호스팅.
//
// 색상 결정: brand blue (#2563EB). 라이트 배경(흰)에서도 보이고 다크 배경
// (#0B1220)에서도 충분히 밝아 보임. 미디어쿼리/<picture> 기반 다크모드
// swap 시도들이 Apple Mail 에서 작동하지 않아 단일 색상 PNG 로 단순화.
//
// 시도 이력:
//  1. base64 data URL → Apple Mail (Sonoma+) 차단
//  2. 외부 URL 검은 PNG + CSS filter brightness/invert → Apple Mail filter 미적용
//  3. light/dark 두 PNG + @media 미디어쿼리 → inline style specificity 로 override 안 됨
//  4. <picture>/<source media> → Apple Mail 이 <source> 무시, fallback 만 표시
//  → 단일 brand blue PNG 채택 (현재).

export const KONTAXT_LOGO_URL = 'https://kontaxt.kr/kontaxt-logo-brand.png';
export const KONTAXT_LOGO_WIDTH = 120;
export const KONTAXT_LOGO_HEIGHT = 25;
