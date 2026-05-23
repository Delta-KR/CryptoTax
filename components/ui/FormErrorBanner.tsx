// 폼 상단의 form-level 에러 배너. password input 에 잘못 붙던 메시지를
// 일관된 위치 / 스타일로 표시하기 위한 공통 컴포넌트.
export function FormErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-md border border-bad/40 bg-bad-soft px-4 py-3 text-[13px] text-bad"
    >
      {message}
    </div>
  );
}
