import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

import type { StockReport, StockStatus } from '../types';

type Client = SupabaseClient<Database>;

export async function getLatestStockReport(
  supabase: Client,
  productId: string
): Promise<StockReport | null> {
  const { data, error } = await supabase
    .from('stock_reports')
    .select('status, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { status: data.status, reportedAt: data.created_at } : null;
}

// user_id is filled by the column default (auth.uid()), and RLS only accepts it for the
// signed-in user, so the client never sends an id of its own.
export async function reportStock(
  supabase: Client,
  productId: string,
  status: StockStatus
): Promise<StockReport> {
  const { data, error } = await supabase
    .from('stock_reports')
    .insert({ product_id: productId, status })
    .select('status, created_at')
    .single();
  if (error) throw error;
  return { status: data.status, reportedAt: data.created_at };
}
