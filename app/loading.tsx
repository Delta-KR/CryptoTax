// 루트 loading state — 새 페이지 segment 진입 시 React Suspense fallback.
// 텍스트만 있는 미니멀 placeholder. 한국어 UX.
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-2 text-[14px] font-medium text-ink">불러오는 중…</div>
        <div className="text-[12px] text-muted">잠시만 기다려주세요.</div>
      </div>
    </div>
  );
}
