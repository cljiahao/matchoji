import { type NextRequest, NextResponse } from 'next/server';

import { safeNextPath } from '@/features/auth/lib/safe-next-path';
import { createClient } from '@/integrations/supabase/server';
import { withLogging } from '@/lib/utils/with-logging';

// Google OAuth redirects here with a `code` param; exchange it for a session cookie.
// The redirects are per-sign-in, so no shared cache may keep them.
function redirect(url: string): NextResponse {
  const res = NextResponse.redirect(url);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const GET = withLogging(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams, origin } = new URL(req.url);
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
