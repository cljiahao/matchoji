import { describe, expect, it } from 'vitest';

import { applyRating } from './product-ratings';

const base = {
  id: 'p1',
  name: 'Kyoto Hojicha',
  brand: null,
  category: 'hojicha' as const,
  grade: null,
  regionName: null,
  supply: null,
  shopUrl: null,
  status: 'approved' as const,
  addedBy: null,
  reviewNote: null,
  mergedInto: null,
  imageUrl: null,
  imageCredit: null,
  createdAt: '2026-09-01T00:00:00Z',
  price: null,
};

describe('applyRating', () => {
  it('copies avg and count from the rating row', () => {
    expect(applyRating(base, { avg_stars: 4.33, review_count: 3 })).toMatchObject({
      topNotes: [],
      avgStars: 4.33,
      reviewCount: 3,
    });
  });

  it('treats a product with no rating row as unrated with zero reviews', () => {
    expect(applyRating(base, undefined)).toMatchObject({ avgStars: null, reviewCount: 0 });
  });

  // PostgREST serialises Postgres numeric/bigint as strings in some configurations;
  // a string here would make the sort comparator concatenate instead of subtract.
  it('coerces numeric strings from the view into numbers', () => {
    const rating = { avg_stars: '3.50', review_count: '2' } as unknown as {
      avg_stars: number;
      review_count: number;
    };
    expect(applyRating(base, rating)).toMatchObject({ avgStars: 3.5, reviewCount: 2 });
  });
});
