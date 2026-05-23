import Link from 'next/link';

// 루트 404 — 존재하지 않는 경로 진입 시.
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-3 text-[40px] font-extrabold leading-none tracking-tighter3 text-brand">
          404
        </div>
        <div className="mb-2 text-[16px] font-bold text-ink">
          페이지를 찾을 수 없습니다
        </div>
        <p className="mb-5 text-[13px] leading-[1.6] text-muted">
          주소가 잘못되었거나 페이지가 이동·삭제된 것 같아요.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-2"
        >
          메인으로
        </Link>
      </div>
    </div>
  );
}
