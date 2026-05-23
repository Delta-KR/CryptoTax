const DEFAULT_NEXT = '/dashboard';

// 클라이언트가 보낸 next 파라미터를 검증해 same-origin 상대경로만 허용한다.
// 외부 도메인으로 튕기는 open-redirect 방어. URL.normalize 가 알아서 막아주지만
// belt-and-braces 로 percent-decoded 형태도 직접 확인.
export function safeNext(next: string | null | undefined): string {
  if (typeof next !== 'string' || next.length === 0) return DEFAULT_NEXT;
  if (!isSafeRelativePath(next)) return DEFAULT_NEXT;
  // 한 번 decode 한 형태도 다시 검사 — `/%2fevil.com` 같은 변형이
  // 브라우저 단에서 다르게 해석될 여지 차단.
  try {
    const decoded = decodeURIComponent(next);
    if (decoded !== next && !isSafeRelativePath(decoded)) return DEFAULT_NEXT;
  } catch {
    return DEFAULT_NEXT;
  }
  return next;
}

function isSafeRelativePath(p: string): boolean {
  // 1. Must start with '/' (relative path on our origin)
  // 2. Must NOT be protocol-relative ('//evil.com') or backslash-prefixed ('/\evil.com'
  //    which some browsers normalize to '//evil.com')
  return /^\/[^/\\]/.test(p);
}
