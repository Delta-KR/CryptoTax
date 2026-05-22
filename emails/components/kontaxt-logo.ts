// Kontaxt 워드마크 로고 — 메일 클라이언트 호환을 위해 외부 URL 호스팅.
//
// 이전엔 data URL base64 인라인 임베드였으나, Apple Mail 신버전(macOS Sonoma+)이
// 보안상 `data:` URL 이미지를 차단하는 문제 발견 (2026-05-23 prod 발송 테스트).
// 외부 URL 호스팅 (public/kontaxt-logo*.png) 으로 전환.
//
// 다크모드 처리: CSS `filter: brightness(0) invert(1)` 가 Apple Mail에서 일부
// 작동하지 않음 → 검은 로고가 다크 배경에 묻힘. 해결책으로 흰색 로고를 별도
// 자산으로 두고 `prefers-color-scheme` 미디어쿼리로 표시 분기.
//
// Light: public/kontaxt-logo.png (검은 워드마크 + 투명 배경)
// Dark:  public/kontaxt-logo-dark.png (흰색 워드마크 + 투명 배경, RGB invert)

export const KONTAXT_LOGO_LIGHT_URL = 'https://kontaxt.kr/kontaxt-logo.png';
export const KONTAXT_LOGO_DARK_URL = 'https://kontaxt.kr/kontaxt-logo-dark.png';
export const KONTAXT_LOGO_WIDTH = 120;
export const KONTAXT_LOGO_HEIGHT = 25;
