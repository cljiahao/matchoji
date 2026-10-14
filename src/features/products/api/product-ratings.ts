import type { Database } from '@/integrations/supabase/database.types';

import type { Product } from '../types';

type RatingRow = Pick<
  Database['public']['Views']['product_ratings']['Row'],
  'avg_stars' | 'review_count'
>;

// Postgres numeric/bigint can arrive as strings depending on PostgREST settings, so
// coerce explicitly rather than trusting the hand-written view type.
export function applyRating(
  product: Omit<Product, 'avgStars' | 'reviewCount'>,
  rating: RatingRow | undefined
): Product {
  return {
    ...product,
    avgStars: rating ? Number(rating.avg_stars) : null,
    reviewCount: rating ? Number(rating.review_count) : 0,
  };
}

// Rated products first (highest average first). Unrated products keep their incoming
// order, which callers pass newest-first, so Array.prototype.sort's stability matters.
export function sortByRating(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    if (a.avgStars === null && b.avgStars === null) return 0;
    if (a.avgStars === null) return 1;
    if (b.avgStars === null) return -1;
    return b.avgStars - a.avgStars;
  });
}
