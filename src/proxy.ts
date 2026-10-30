import { type NextRequest } from 'next/server';

import { updateSession } from '@/integrations/supabase/middleware';
import { buildCsp, generateNonce } from '@/lib/security/csp';

// Next.js 16 replaces middleware.ts with proxy.ts.
export async function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });

  // Next reads the nonce from the request's CSP header while rendering and stamps it on its own
  // scripts. updateSession builds its response from this request, so the headers carry through.
  request.headers.set('x-nonce', nonce);
  request.headers.set('Content-Security-Policy', csp);

  const response = await updateSession(request);
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

// The health probe needs no session, so it skips the per-request getUser() round trip.
export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
