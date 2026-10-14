// Dev-only escape hatch: true once real Supabase credentials exist in .env.local.
// Everything gated on this is temporary — remove the gate once a project is set up.
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

// Mock products name real brands with invented ratings, so a production deploy that is
// missing its env vars must fail loudly rather than present them as real data.
export function shouldUseMockData(): boolean {
  if (isSupabaseConfigured()) return false;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return true;
}
