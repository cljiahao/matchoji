import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

// The label_scans trigger enforces the daily cap (limit_daily_inserts raises P0001), so the
// count lives in Postgres and holds across serverless instances. The image is never stored:
// a row is only the fact that a scan happened.
export async function recordScan(supabase: SupabaseClient<Database>): Promise<'ok' | 'limited'> {
  const { error } = await supabase.from('label_scans').insert({ id: crypto.randomUUID() });
  if (!error) return 'ok';
  if (error.code === 'P0001') return 'limited';
  throw error;
}
