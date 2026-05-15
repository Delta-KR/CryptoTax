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
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist'],
    outputFileTracingIncludes: {
      '/api/report': [
        './node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
      ],
    },
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
