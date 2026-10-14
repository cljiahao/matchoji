import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/integrations/supabase/database.types';

import type { Review } from '../types';

type Client = SupabaseClient<Database>;

export async function listReviews(supabase: Client, productId: string): Promise<Review[]> {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, product_id, user_id, stars, notes, photo_url, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (reviews.length === 0) return [];

  // profiles is owner-only (it holds email); public_profiles exposes just the display
  // name. Fetched separately since views carry no FK metadata for PostgREST embedding.
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, display_name')
    .in(
      'id',
      reviews.map((r) => r.user_id)
    );

  const nameByUserId = new Map(profiles?.map((p) => [p.id, p.display_name]));

  return reviews.map((r) => ({
    id: r.id,
    productId: r.product_id,
    reviewerName: nameByUserId.get(r.user_id) ?? 'Anonymous',
    stars: r.stars,
    notes: r.notes,
    photoUrl: r.photo_url,
    createdAt: r.created_at,
  }));
}
