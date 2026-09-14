import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/integrations/supabase/server';
import { withLogging } from '@/lib/utils/with-logging';

// Google OAuth redirects here with a `code` param; exchange it for a session cookie.
export const GET = withLogging(async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
});
