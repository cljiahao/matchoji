import { createClient } from '@/integrations/supabase/client';

// `nextPath` rides through the callback's `next` param so the user lands back where
// they started (e.g. the product they were rating) instead of the feed.
export async function signInWithGoogle(nextPath: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient();
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', nextPath);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString() },
    });
    return { error };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
