import { type NextRequest, NextResponse } from 'next/server';

import { safeNextPath } from '@/features/auth/lib/safe-next-path';
import { createClient } from '@/integrations/supabase/server';
import { SITE_URL } from '@/lib/constants/env';
import { getAppOrigin } from '@/lib/utils/request-origin';
import { withLogging } from '@/lib/utils/with-logging';

// Google OAuth redirects here with a `code` param; exchange it for a session cookie.
// The redirects are per-sign-in, so no shared cache may keep them.
function redirect(url: string): NextResponse {
  const res = NextResponse.redirect(url);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

// A forwarded host is honoured only when it is the configured site's host; any other value
// (a spoofed x-forwarded-host, an unlisted preview domain) falls back to the origin the
// request itself arrived on.
function trustedOrigin(req: NextRequest): string {
  const origin = getAppOrigin(req);
  return new URL(origin).host === new URL(SITE_URL).host ? origin : req.nextUrl.origin;
}

export const GET = withLogging(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url);
  const origin = trustedOrigin(req);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(`${origin}${next}`);
    }
  }

  return redirect(`${origin}/auth/error`);
});
