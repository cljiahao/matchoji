import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

type Client = SupabaseClient<Database>;

// The sitemap only needs to know whether a listing page has anything on it, so these read a row
// count and no rows, instead of loading every café with its scores the way the pages do. The
// filters mirror listCafes and listTasters, so a page is listed exactly when it is indexable.
export async function cityHasCafes(supabase: Client, city: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('cafes')
    .select('id', { count: 'exact', head: true })
    .eq('city_slug', city)
    .eq('status', 'approved')
    .is('merged_into', null);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function hasTrustedTasters(supabase: Client): Promise<boolean> {
  const { count, error } = await supabase
    .from('public_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_trusted_taster', true)
    .eq('is_public', true);
  if (error) throw error;
  return (count ?? 0) > 0;
}
