import { describe, expect, it } from 'vitest';

import type { Product } from '../types';

import { gradeOptions } from './filter-products';

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
  addedBy: null,
  reviewNote: null,
  mergedInto: null,
  imageUrl: null,
  createdAt: '2026-09-01T00:00:00Z',
  avgStars,
  reviewCount: avgStars === null ? 0 : 1,
  topNotes: [],
  price: null,
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
