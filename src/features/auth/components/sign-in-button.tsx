'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/integrations/supabase/client';

export function SignInButton() {
  async function handleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return <Button onClick={handleSignIn}>Sign in with Google</Button>;
}
