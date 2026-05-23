import { Skeleton } from '@/components/ui/Skeleton';

// (app) segment loading — 사이드바·탑바 형태를 유지한 채 컨텐츠만 skeleton.
// AppShell 가 user 로딩 시 null 반환하던 깜빡임을 막아줌.
export default function AppLoading() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[240px] border-r border-line bg-bg-soft lg:block" />
      <div className="flex flex-1 flex-col">
        <header className="h-[60px] border-b border-line bg-bg/85" />
        <main className="flex-1 px-5 py-8 sm:px-8">
          <div className="mb-6 flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="mt-6">
            <Skeleton className="h-48" />
          </div>
        </main>
      </div>
    </div>
  );
}
