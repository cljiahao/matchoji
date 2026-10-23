import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import { TASTE_ATTRIBUTES, type PrepMethod } from '../lib/tasting-vocab';
import type { Review } from '../types';

type Client = SupabaseClient<Database>;
type ReviewRow = Database['public']['Tables']['reviews']['Row'];

export const REVIEW_COLUMNS =
  'id, product_id, user_id, stars, notes, photo_url, created_at, flavor_notes, sweetness, umami, bitterness, body, prep_method, dose_g, water_ml, water_temp_c, tasted_on';

// numeric and smallint can arrive as strings depending on PostgREST settings.
const num = (v: number | string | null) => (v === null ? null : Number(v));

export function mapReviewRow(r: ReviewRow, reviewerName: string): Review {
  const profile: Review['profile'] = {};
  for (const attribute of TASTE_ATTRIBUTES) {
    const value = num(r[attribute]);
    if (value !== null) profile[attribute] = value;
  }
  return {
    id: r.id,
    productId: r.product_id,
    reviewerName,
    stars: r.stars,
    notes: r.notes,
    photoUrl: r.photo_url,
    createdAt: r.created_at,
    flavorNotes: r.flavor_notes ?? [],
    profile,
    prep: {
      method: (r.prep_method as PrepMethod | null) ?? null,
      doseG: num(r.dose_g),
      waterMl: num(r.water_ml),
      waterTempC: num(r.water_temp_c),
    },
    tastedOn: r.tasted_on,
  };
}

export async function listReviews(supabase: Client, productId: string): Promise<Review[]> {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (reviews.length === 0) return [];

  // profiles is owner-only (it holds email); public_profiles exposes just the display
  // name. Fetched separately since views carry no FK metadata for PostgREST embedding.
  const { data: profiles } = await selectIn(
    reviews.map((r) => r.user_id),
    (ids) => supabase.from('public_profiles').select('id, display_name').in('id', ids)
  );

  const nameByUserId = new Map(profiles.map((p) => [p.id, p.display_name]));

  return reviews.map((r) => mapReviewRow(r, nameByUserId.get(r.user_id) ?? 'Anonymous'));
}
