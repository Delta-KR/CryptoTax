// Kontaxt 워드마크 로고 — 메일 클라이언트 호환을 위해 외부 URL 호스팅.
//
// 이전엔 data URL base64 인라인 임베드였으나, Apple Mail 신버전(macOS Sonoma+)이
// 보안상 `data:` URL 이미지를 차단하는 문제 발견 (2026-05-23 prod 발송 테스트).
// 외부 URL 호스팅 (public/kontaxt-logo.png) 으로 전환하되, Apple Mail 외부
// 이미지 자동 차단 시 사용자가 "사진 로드" 한 번 클릭 → 신뢰 발신자 등록 →
// 이후 자동 표시되도록 둠. 트랜잭셔널 메일 표준 동작.
//
// 다크모드 자동 반전은 `filter: brightness(0) invert(1)` CSS 로 처리 (EmailLayout).

export const KONTAXT_LOGO_DATA_URL = 'https://kontaxt.kr/kontaxt-logo.png';
export const KONTAXT_LOGO_WIDTH = 120;
export const KONTAXT_LOGO_HEIGHT = 25;
