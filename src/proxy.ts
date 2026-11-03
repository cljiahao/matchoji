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

// The health probe and the Sentry tunnel carry no session, so they skip the per-request getUser()
// round trip (the tunnel is a same-origin rewrite to Sentry's ingest, never an app page). So do
// the share-preview images (opengraph-image, twitter-image, with or without Next's hash suffix),
// the manifest and the app icons under /icons: crawlers and installers arrive with no cookies and
// only fetch binary or JSON files that need neither a nonce nor a session refresh.
export const config = {
  matcher: [
    '/((?!api/health|monitoring|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|icons/|(?:.+/)?(?:opengraph|twitter)-image(?:-[^/]*)?$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
