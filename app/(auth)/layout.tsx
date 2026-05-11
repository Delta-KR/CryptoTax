import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-base font-bold tracking-[-0.01em] text-ink"
        >
          크립토택스
        </Link>
        <ThemeToggle />
      </header>
      <main
        id="main"
        className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5 pb-12"
      >
        {children}
      </main>
    </>
  );
}
