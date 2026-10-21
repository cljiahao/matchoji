import { describe, expect, it } from 'vitest';

import { getMockProduct, getMockProducts, getMockReviews } from './mock-data';

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
