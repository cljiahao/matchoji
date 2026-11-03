import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

import { toPricePoint, type PricePoint } from '../lib/price-history';

type Client = SupabaseClient<Database>;

// Postgres "undefined table" and PostgREST's schema-cache miss: the migration is applied by
// hand, so pages show no history rather than an error until it is.
const MISSING_TABLE = new Set(['42P01', 'PGRST205']);

// A tea's recorded prices, oldest first.
export async function listPriceHistory(supabase: Client, productId: string): Promise<PricePoint[]> {
  const { data, error } = await supabase
    .from('tea_price_history')
    .select('recorded_at, price, pack_grams')
    .eq('product_id', productId)
    .order('recorded_at', { ascending: true });
  if (error) {
    if (error.code && MISSING_TABLE.has(error.code)) return [];
    throw error;
  }
  return data.map(toPricePoint);
}
