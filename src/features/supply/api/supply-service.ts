import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

import { summarizeSupply } from '../lib/summarize-supply';
import type { SupplyOverview } from '../types';

export async function getSupplyOverview(
  supabase: SupabaseClient<Database>
): Promise<SupplyOverview> {
  const [stats, regions] = await Promise.all([
    supabase.from('tea_production_stats').select('prefecture, year, metric, value, source'),
    supabase.from('regions').select('id, name, prefecture'),
  ]);
  if (stats.error) throw stats.error;
  if (regions.error) throw regions.error;
  return summarizeSupply(stats.data, regions.data);
}
