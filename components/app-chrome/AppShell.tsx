'use client';
import { useState } from 'react';
import {
  UserContextProvider,
  useUserContext,
} from '@/components/app-chrome/UserContextProvider';
import { Sidebar } from '@/components/app-chrome/Sidebar';
import { Topbar } from '@/components/app-chrome/Topbar';
import { MobileDrawer } from '@/components/app-chrome/MobileDrawer';
import { ToastProvider } from '@/components/ui/Toast';

// 서버 layout이 이미 미인증을 차단했으므로 여기선 user 로딩만 처리.
// useCurrentUser 호출은 UserContextProvider 안에서 1회만 (audit perf P1-1).
// child pages 는 useUserContext() 로 같은 값 공유.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UserContextProvider>
      <AppShellInner>{children}</AppShellInner>
    </UserContextProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUserContext();
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
