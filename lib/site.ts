// 사이트 URL — 빌드 환경에 따라 자동 감지.
// 우선순위:
// 1. NEXT_PUBLIC_SITE_URL (수동 설정한 커스텀 도메인 — 가장 안정)
// 2. VERCEL_URL (Vercel이 자동 주입하는 배포 URL)
// 3. localhost 기본값 (로컬 개발)
//
// Vercel 배포 후 안정적인 production URL을 사용하려면
// Vercel 대시보드 > Project > Settings > Environment Variables에
// NEXT_PUBLIC_SITE_URL=https://your-domain.com 추가.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const SITE_NAME = '크립토택스';
