'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, type User } from '@/lib/mock/auth';
import { Sidebar } from '@/components/app-chrome/Sidebar';
import { Topbar } from '@/components/app-chrome/Topbar';
import { MobileDrawer } from '@/components/app-chrome/MobileDrawer';
import { ToastProvider } from '@/components/ui/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace('/login');
      return;
    }
    setUser(u);
    setChecked(true);
  }, [router]);

  if (!checked || !user) return null;

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
