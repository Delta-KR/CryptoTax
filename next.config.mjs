/** @type {import('next').NextConfig} */

// CSP는 production에서만 strict하게 적용. dev는 HMR 때문에 unsafe-eval 등이 필요.
// 'unsafe-inline'은 layout.tsx의 themeRestoreScript와 JSON-LD, Tailwind 인라인 스타일을 위해
// 유지 — nonce 도입 시 별도 PR에서 제거.
const isProd = process.env.NODE_ENV === 'production';

const cspDirectives = [
  "default-src 'self'",
  // scripts: self + 인라인(테마 복원·JSON-LD) + Turnstile + dev HMR
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isProd ? '' : " 'unsafe-eval'"}`,
  // styles: self + 인라인 (Tailwind·@react-pdf 등)
  "style-src 'self' 'unsafe-inline'",
  // images: self + data: + blob: (PDF preview, generated thumbnails 등)
  "img-src 'self' data: blob:",
  // fonts: self + data: (인라인 base64 폰트)
  "font-src 'self' data:",
  // connect: self + Supabase API/Realtime + Turnstile validation
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
  // frames: Turnstile widget
  'frame-src https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
];

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
  // HSTS — kontaxt.kr 은 HTTPS-only. preload 등재 후에도 안전한 값.
  // Vercel 이 엣지에서 자동 부여하긴 하지만 명시 선언으로 환경 변화 시 안전.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // OAuth popup (signInWithOAuth) 호환을 위해 strict 가 아닌 allow-popups.
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin-allow-popups',
  },
];

const nextConfig = {
  reactStrictMode: true,
  // workspace root inference warning 차단 — sibling lockfile (vault·worktrees)
  // 으로 인한 잘못된 root 추정 방지. import.meta.dirname 은 Node 20.11+.
  turbopack: { root: import.meta.dirname },
  // Next 16 에서 experimental.* 두 키가 top-level 로 이동.
  // pdf-parse / pdfjs-dist 가 server bundle 에서 빠져야 prod /api/report 정상.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/report': [
      './node_modules/pretendard/dist/public/variable/PretendardVariable.ttf',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
