import type { SupabaseClient } from '@supabase/supabase-js';

import { REVIEW_COLUMNS, mapReviewRow } from '@/features/reviews';
import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import { buildYearInTea } from '../lib/year-in-tea';
import type { JournalEntry, YearInTea } from '../types';

type Client = SupabaseClient<Database>;

// One taster's tastings, newest first. Row-level security decides whose a caller may read: a
// public taster's are open, a private taster's are their own.
export async function listUserTastings(supabase: Client, userId: string): Promise<JournalEntry[]> {
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
    (ids) =>
      supabase.from('products').select('id, name, brand, category, status, region_id').in('id', ids)
  );
  if (productsError) throw productsError;

  const regionIds = products.flatMap((p) => (p.region_id ? [p.region_id] : []));
  const { data: regions, error: regionsError } = regionIds.length
    ? await selectIn(regionIds, (ids) => supabase.from('regions').select('id, name').in('id', ids))
    : { data: [], error: null };
  if (regionsError) throw regionsError;

  const byId = new Map(products.map((p) => [p.id, p]));
  const regionName = new Map(regions.map((r) => [r.id, r.name]));
  // The journal is the reader's own, so their name isn't shown on each entry.
  return rows.flatMap((r) => {
    const found = byId.get(r.product_id);
    if (!found) return [];
    const { region_id: regionId, ...product } = found;
    return [
      {
        ...mapReviewRow(r, ''),
        product,
        regionName: (regionId && regionName.get(regionId)) || null,
      },
    ];
  });
}

export const listMyReviews = listUserTastings;

// A public taster's recap for the share page and card; null for a private or unknown taster,
// or a year with too few tastings, so a private journal never leaks through a guessed URL.
export async function getPublicYear(
  supabase: Client,
  userId: string,
  year: number
): Promise<{ taster: string; recap: YearInTea } | null> {
  const { data: profile, error } = await supabase
    .from('public_profiles')
    .select('display_name, is_public')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile?.is_public) return null;
  const recap = buildYearInTea(await listUserTastings(supabase, userId), year);
  return recap ? { taster: profile.display_name, recap } : null;
}

export async function isProfilePublic(supabase: Client, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('is_public')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.is_public ?? false;
}
