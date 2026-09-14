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

  // profiles has no declared FK in this hand-written Database type, so it's fetched
  // separately rather than embedded via PostgREST relationship syntax.
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in(
      'id',
      reviews.map((r) => r.user_id)
    );

  const emailByUserId = new Map(profiles?.map((p) => [p.id, p.email]));

  return reviews.map((r) => ({
    id: r.id,
    productId: r.product_id,
    reviewerEmail: emailByUserId.get(r.user_id) ?? 'Unknown',
    stars: r.stars,
    notes: r.notes,
    photoUrl: r.photo_url,
    createdAt: r.created_at,
  }));
}
