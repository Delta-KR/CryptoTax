// Naver OAuth 자체 flow 공통 상수.
// __Host- prefix 가 path=/, secure, no domain 을 강제 → 서브도메인에서
// fixation 불가. start 와 callback 에서 동일 이름으로 일치돼야 CSRF 검증 작동.
export const NAVER_STATE_COOKIE = '__Host-naver_oauth_state';
