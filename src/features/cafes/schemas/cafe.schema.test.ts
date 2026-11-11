import { describe, expect, it } from 'vitest';

import { cafeSchema } from './cafe.schema';
import { drinkSchema } from './drink.schema';

describe('cafeSchema', () => {
  it('accepts a minimal café and strips a leading @ from the handle', () => {
    expect(
      cafeSchema.parse({
        name: ' Matcha Bar ',
        citySlug: 'singapore',
        instagramHandle: '@matcha.bar',
      })
    ).toEqual({ name: 'Matcha Bar', citySlug: 'singapore', instagramHandle: 'matcha.bar' });
  });

  it('treats blank optional fields as unset', () => {
    expect(
      cafeSchema.parse({
        name: 'A',
        citySlug: 'johor-bahru',
        area: '',
        address: '',
        instagramHandle: '',
        websiteUrl: '',
      })
    ).toEqual({ name: 'A', citySlug: 'johor-bahru' });
  });

  it('rejects an unknown city, a bad handle and a non-https site', () => {
    expect(cafeSchema.safeParse({ name: 'A', citySlug: 'kl' }).success).toBe(false);
    expect(
      cafeSchema.safeParse({ name: 'A', citySlug: 'singapore', instagramHandle: 'a b' }).success
    ).toBe(false);
    expect(
      cafeSchema.safeParse({ name: 'A', citySlug: 'singapore', websiteUrl: 'http://x.com' }).success
    ).toBe(false);
  });
});

describe('drinkSchema', () => {
  const base = {
    cafeId: '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e',
    name: 'Hojicha latte',
    base: 'hojicha',
    style: 'latte',
    serving: 'both',
  };

  it('accepts a drink with or without a price', () => {
    expect(drinkSchema.parse(base)).toEqual(base);
    expect(drinkSchema.parse({ ...base, price: '6.5' })).toEqual({ ...base, price: 6.5 });
    expect(drinkSchema.parse({ ...base, price: '' })).toEqual(base);
  });

  it('rejects a negative price, a bad base and a missing name', () => {
    expect(drinkSchema.safeParse({ ...base, price: -1 }).success).toBe(false);
    expect(drinkSchema.safeParse({ ...base, base: 'chai' }).success).toBe(false);
    expect(drinkSchema.safeParse({ ...base, name: ' ' }).success).toBe(false);
  });

  it('rejects a handle made only of dots', () => {
    for (const instagramHandle of ['.', '..', '@..'])
      expect(
        cafeSchema.safeParse({ name: 'A', citySlug: 'singapore', instagramHandle }).success
      ).toBe(false);
    expect(
      cafeSchema.safeParse({ name: 'A', citySlug: 'singapore', instagramHandle: 'a.b' }).success
    ).toBe(true);
  });
});
