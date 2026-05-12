'use client';
import { useState } from 'react';
import { useCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/app-chrome/Sidebar';
import { Topbar } from '@/components/app-chrome/Topbar';
import { MobileDrawer } from '@/components/app-chrome/MobileDrawer';
import { ToastProvider } from '@/components/ui/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading || !user) return null;

  return (
    <ToastProvider>
      <Sidebar user={user} variant="desktop" />
      <MobileDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} user={user} />
      <div className="lg:pl-[240px]">
        <Topbar user={user} onMobileNavToggle={() => setMobileNavOpen(true)} />
        <main id="main" className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
