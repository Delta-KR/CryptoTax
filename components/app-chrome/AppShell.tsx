'use client';
import { useState } from 'react';
import { useCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/app-chrome/Sidebar';
import { Topbar } from '@/components/app-chrome/Topbar';
import { MobileDrawer } from '@/components/app-chrome/MobileDrawer';
import { ToastProvider } from '@/components/ui/Toast';

// 서버 layout이 이미 미인증을 차단했으므로 여기선 user 로딩만 처리.
// reactive 상태(이름·plan 변경)를 위해 useCurrentUser는 유지.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading || !user) return null;

  return (
    <ToastProvider>
      <Sidebar user={user} variant="desktop" />
      <MobileDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        user={user}
      />
      <div className="lg:pl-[240px]">
        <Topbar user={user} onMobileNavToggle={() => setMobileNavOpen(true)} />
        <main
          id="main"
          className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-10"
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
