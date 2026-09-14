// Dev-only escape hatch: true once real Supabase credentials exist in .env.local.
// Everything gated on this is temporary — remove the gate once a project is set up.
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
