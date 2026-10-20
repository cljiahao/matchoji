import { describe, expect, it } from 'vitest';

import { makeProduct } from '../../../../test/support/render';
import { sortProducts } from './sort-products';

const products = [
  makeProduct({ id: 'a', avgStars: 4.8, reviewCount: 2, createdAt: '2026-09-01T00:00:00Z' }),
  makeProduct({ id: 'b', avgStars: 3.9, reviewCount: 9, createdAt: '2026-10-01T00:00:00Z' }),
  makeProduct({ id: 'c', avgStars: null, reviewCount: 0, createdAt: '2026-10-10T00:00:00Z' }),
];

describe('sortProducts', () => {
  it('top puts the highest average first and unrated last', () => {
    expect(sortProducts(products, 'top').map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('reviewed puts most-reviewed first', () => {
    expect(sortProducts(products, 'reviewed').map((p) => p.id)).toEqual(['b', 'a', 'c']);
  });

  it('newest puts the latest added first', () => {
    expect(sortProducts(products, 'newest').map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });
});
