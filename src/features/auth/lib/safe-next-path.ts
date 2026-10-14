// The OAuth callback redirects to `${origin}${next}`, so `next` must be a plain
// same-origin path or it becomes an open redirect.
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/';
  }
  return next;
}
