const DEFAULT_NEXT = '/dashboard';

export function safeNext(next: string | null | undefined): string {
  if (typeof next !== 'string' || next.length === 0) return DEFAULT_NEXT;
  // 1. Must start with '/' (relative path on our origin)
  // 2. Must NOT be protocol-relative ('//evil.com') or backslash-prefixed ('/\evil.com'
  //    which some browsers normalize to '//evil.com')
  if (!/^\/[^/\\]/.test(next)) return DEFAULT_NEXT;
  return next;
}
