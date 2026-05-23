import type { NextRequest } from 'next/server';

// Vercel/Cloudflare 등 proxy 환경에서 x-forwarded-for 첫 항목이 client IP.
// 로컬 dev 나 proxy 미설정 환경에선 x-real-ip → 'unknown' fallback.
export function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
