import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

// 로그인·가입·비밀번호 재설정은 검색 색인 가치가 없다. 루트 metadata 의
// index:true 를 상속받지 않도록 그룹 전체에 noindex 를 적용한다.
// crawl 은 허용(robots.txt Allow)해 크롤러가 이 noindex 태그를 보게 하고,
// 페이지 내부 링크는 따라가도록 follow 는 유지한다.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-base font-bold tracking-[-0.01em] text-ink"
        >
          Kontaxt
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
