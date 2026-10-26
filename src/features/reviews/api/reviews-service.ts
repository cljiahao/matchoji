import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';
import { selectIn } from '@/integrations/supabase/select-in';

import { TASTE_ATTRIBUTES, type PrepMethod } from '../lib/tasting-vocab';
import type { Review } from '../types';

type Client = SupabaseClient<Database>;
type ReviewRow = Database['public']['Tables']['reviews']['Row'];

export const REVIEW_COLUMNS =
  'id, product_id, user_id, stars, notes, photo_url, created_at, flavor_notes, sweetness, umami, bitterness, body, prep_method, dose_g, water_ml, water_temp_c, tasted_on, harvest_year, flush';

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
    authorId: r.user_id,
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
    edition: {
      harvestYear: r.harvest_year,
      flush: r.flush && r.flush !== 'unspecified' ? r.flush : null,
    },
  };
}

// A tea's page shows each person's latest tasting only, so the list, distribution and taste
// summary agree with the score (product_ratings counts the same rows). product_reviews returns
// them newest first, with a private taster's id and photo withheld.
export async function listReviews(supabase: Client, productId: string): Promise<Review[]> {
  const { data: reviews, error } = await supabase.rpc('product_reviews', { product: productId });

  if (error) throw error;
  if (reviews.length === 0) return [];

  // profiles is owner-only (it holds email); public_profiles exposes just the display
  // name. Fetched separately since views carry no FK metadata for PostgREST embedding.
  const { data: profiles, error: profilesError } = await selectIn(
    reviews.flatMap((r) => (r.user_id ? [r.user_id] : [])),
    (ids) => supabase.from('public_profiles').select('id, display_name').in('id', ids)
  );

  if (profilesError) throw profilesError;
  const nameByUserId = new Map(profiles.map((p) => [p.id, p.display_name]));

  // A private taster's ratings show without a name; a deleted account's stay, unnamed too.
  return reviews.map((r) =>
    mapReviewRow(
      r,
      r.author_private
        ? 'Private taster'
        : (r.user_id && nameByUserId.get(r.user_id)) || 'Former taster'
    )
  );
}

export interface EditionRating {
  harvestYear: number;
  flush: string;
  reviewCount: number;
  avgStars: number;
  topHarvest: boolean;
}

// A tea's ratings per harvest, newest harvest first.
export async function listEditions(supabase: Client, productId: string): Promise<EditionRating[]> {
  const { data, error } = await supabase
    .from('edition_ratings')
    .select('harvest_year, flush, review_count, avg_stars, top_harvest')
    .eq('product_id', productId)
    .order('harvest_year', { ascending: false });
  if (error) throw error;
  return data.map((e) => ({
    harvestYear: e.harvest_year,
    flush: e.flush,
    reviewCount: Number(e.review_count),
    avgStars: Number(e.avg_stars),
    topHarvest: e.top_harvest,
  }));
}
