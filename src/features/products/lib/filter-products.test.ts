import { describe, expect, it } from 'vitest';

import type { Product } from '../types';

import { filterByFacets, gradeOptions } from './filter-products';

const product = (id: string, grade: string | null, avgStars: number | null): Product => ({
  id,
  name: id,
  brand: null,
  category: 'matcha',
  grade,
  regionName: null,
  supply: null,
  shopUrl: null,
  status: 'approved',
  imageUrl: null,
  createdAt: '2026-09-01T00:00:00Z',
  avgStars,
  reviewCount: avgStars === null ? 0 : 1,
  topNotes: [],
});

const products = [
  product('a', 'Ceremonial', 4.6),
  product('b', 'ceremonial ', 3.9),
  product('c', 'Culinary', 4),
  product('d', null, null),
  product('e', '  ', 3),
];

describe('gradeOptions', () => {
  it('lists each grade once, ignoring case and blanks, in name order', () => {
    expect(gradeOptions(products)).toEqual(['Ceremonial', 'Culinary']);
    expect(gradeOptions([])).toEqual([]);
  });
});

describe('filterByFacets', () => {
  const ids = (list: Product[]) => list.map((p) => p.id);

  it('keeps everything without facets', () => {
    expect(ids(filterByFacets(products, { sort: 'top' }))).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('matches grade case-insensitively and skips ungraded teas', () => {
    expect(ids(filterByFacets(products, { grade: 'CEREMONIAL', sort: 'top' }))).toEqual(['a', 'b']);
  });

  it('keeps teas at or above the minimum rating and drops unrated ones', () => {
    expect(ids(filterByFacets(products, { minRating: 4, sort: 'top' }))).toEqual(['a', 'c']);
  });

  it('combines grade and rating', () => {
    expect(
      ids(filterByFacets(products, { grade: 'ceremonial', minRating: 4, sort: 'top' }))
    ).toEqual(['a']);
  });
});
