import { describe, expect, it } from 'vitest';

import {
  MOCK_REGIONS,
  getMockProduct,
  getMockProducts,
  getMockRegionSummaries,
  getMockReviews,
} from './mock-data';

describe('mock data', () => {
  it('filters products by category', () => {
    const hojicha = getMockProducts('hojicha');
    expect(hojicha.length).toBeGreaterThan(0);
    expect(hojicha.every((p) => p.category === 'hojicha')).toBe(true);
    expect(getMockProducts().length).toBeGreaterThan(hojicha.length);
  });

  it('searches name and brand case-insensitively, within a category', () => {
    expect(getMockProducts(undefined, 'UJI').map((p) => p.id)).toEqual(['mock-1']);
    expect(getMockProducts(undefined, 'ippodo').map((p) => p.name)).toEqual([
      'Kyoto Roasted Bancha',
    ]);
    expect(getMockProducts('hojicha', 'uji')).toEqual([]);
  });

  it('narrows products by mock region id and counts teas per region', () => {
    const uji = MOCK_REGIONS[0];
    expect(getMockProducts(undefined, undefined, uji.id).map((p) => p.id)).toEqual(['mock-1']);
    expect(getMockProducts(undefined, undefined, 'unknown')).toEqual([]);
    const summaries = getMockRegionSummaries();
    expect(summaries).toHaveLength(MOCK_REGIONS.length);
    expect(summaries.find((r) => r.id === uji.id)?.counts).toEqual({ matcha: 1, hojicha: 0 });
  });

  it('takes score and count from the mock reviews', () => {
    const uji = getMockProduct('mock-1');
    expect(uji?.reviewCount).toBe(getMockReviews('mock-1').length);
    expect(getMockProduct('mock-4')).toMatchObject({ reviewCount: 0, avgStars: null });
  });

  it('looks up a product and its reviews by id', () => {
    expect(getMockProduct('mock-1')?.name).toBe('Uji Ceremonial');
    expect(getMockProduct('nope')).toBeNull();
    expect(getMockReviews('mock-1').length).toBeGreaterThan(0);
    expect(getMockReviews('nope')).toEqual([]);
  });
});
