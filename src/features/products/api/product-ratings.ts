import type { Database } from '@/integrations/supabase/database.types';

import type { Product } from '../types';

type RatingRow = Pick<
  Database['public']['Views']['product_ratings']['Row'],
  'avg_stars' | 'review_count'
>;

// Postgres numeric/bigint can arrive as strings depending on PostgREST settings, so
// coerce explicitly rather than trusting the hand-written view type.
export function applyRating(
  product: Omit<Product, 'avgStars' | 'reviewCount' | 'topNotes'>,
  rating: RatingRow | undefined
): Product {
  return {
    ...product,
    avgStars: rating ? Number(rating.avg_stars) : null,
    reviewCount: rating ? Number(rating.review_count) : 0,
    topNotes: [],
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

const CARD_NOTES = 2;

// Counts notes across a product's reviews; ties keep first-seen order (Map + stable sort).
export function topNotesByProduct(
  rows: { product_id: string; flavor_notes: string[] | null }[]
): Map<string, string[]> {
  const counts = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const forProduct = counts.get(row.product_id) ?? new Map<string, number>();
    for (const note of row.flavor_notes ?? [])
      forProduct.set(note, (forProduct.get(note) ?? 0) + 1);
    counts.set(row.product_id, forProduct);
  }
  return new Map(
    [...counts].map(([id, notes]) => [
      id,
      [...notes]
        .sort((a, b) => b[1] - a[1])
        .slice(0, CARD_NOTES)
        .map(([note]) => note),
    ])
  );
}
