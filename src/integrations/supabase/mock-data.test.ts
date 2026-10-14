import { describe, expect, it } from 'vitest';

import { getMockProduct, getMockProducts, getMockReviews } from './mock-data';

describe('mock data', () => {
  it('filters products by category', () => {
    const hojicha = getMockProducts('hojicha');
    expect(hojicha.length).toBeGreaterThan(0);
    expect(hojicha.every((p) => p.category === 'hojicha')).toBe(true);
    expect(getMockProducts().length).toBeGreaterThan(hojicha.length);
  });

  it('looks up a product and its reviews by id', () => {
    expect(getMockProduct('mock-1')?.name).toBe('Uji Ceremonial');
    expect(getMockProduct('nope')).toBeNull();
    expect(getMockReviews('mock-1').length).toBeGreaterThan(0);
    expect(getMockReviews('nope')).toEqual([]);
  });
});
