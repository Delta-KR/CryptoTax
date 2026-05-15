import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component context — cookies are read-only.
            // Auth refresh will happen via middleware instead.
          }
        },
      },
    },
  );
}

export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.',
    );
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {
          // admin client는 세션 쿠키 사용 안 함 — service_role 토큰이 cookie로 새지 않도록.
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
