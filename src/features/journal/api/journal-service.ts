import type { SupabaseClient } from '@supabase/supabase-js';

import { REVIEW_COLUMNS, mapReviewRow } from '@/features/reviews';
import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import type { JournalEntry } from '../types';

type Client = SupabaseClient<Database>;

export async function listMyReviews(supabase: Client, userId: string): Promise<JournalEntry[]> {
  const { data: rows, error } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('user_id', userId)
    .order('tasted_on', { ascending: false })
    // Same-day tastings keep a stable newest-first order.
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (rows.length === 0) return [];

  const { data: products, error: productsError } = await selectIn(
    rows.map((r) => r.product_id),
    (ids) => supabase.from('products').select('id, name, brand, category, status').in('id', ids)
  );
  if (productsError) throw productsError;

  const byId = new Map(products.map((p) => [p.id, p]));
  // The journal is the reader's own, so their name isn't shown on each entry.
  return rows.flatMap((r) => {
    const product = byId.get(r.product_id);
    return product ? [{ ...mapReviewRow(r, ''), product }] : [];
  });
}
