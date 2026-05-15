import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-chrome/AppShell';

// 서버 사이드 auth 가드 — middleware matcher 누락 시에도 보호 페이지가 노출되지 않도록 defense-in-depth.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const pathname = headers().get('x-pathname') ?? '/dashboard';
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return <AppShell>{children}</AppShell>;
}
