import { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// 보호 경로에만 미들웨어 실행. public 페이지(/, /guide, /legal/*)는 Supabase 호출 없이 즉시 응답.
// 신규 보호 prefix 추가 시 lib/supabase/middleware.ts의 PROTECTED_PREFIXES도 같이 갱신할 것.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/tax/:path*',
    '/report/:path*',
    '/billing/:path*',
    '/settings/:path*',
  ],
};
