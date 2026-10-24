import { type NextRequest } from 'next/server';

import { updateSession } from '@/integrations/supabase/middleware';

// Next.js 16 replaces middleware.ts with proxy.ts.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// The health probe needs no session, so it skips the per-request getUser() round trip.
export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
