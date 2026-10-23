import { describe, expect, it } from 'vitest';

import { listingSchema, vendorSchema } from './marketplace.schema';

describe('vendorSchema', () => {
  it('normalises codes, drops empty optionals and splits the ships-to list', () => {
    expect(
      vendorSchema.parse({
        name: '  Kyoto Leaf ',
        profileInfo: '',
        website: '',
        country: 'jp',
        shipsTo: 'sg, my  JP,sg',
      })
    ).toEqual({ name: 'Kyoto Leaf', country: 'JP', shipsTo: ['SG', 'MY', 'JP'] });
  });

  it('rejects http websites, long country names and an empty ships-to list', () => {
    const result = vendorSchema.safeParse({
      name: 'Leaf',
      website: 'http://leaf.example',
      country: 'Japan',
      shipsTo: ' ',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual([
      'country',
      'shipsTo',
      'website',
    ]);
  });
});

describe('listingSchema', () => {
  const valid = {
    productId: '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e',
    price: '32.50',
    currency: 'sgd',
    stock: '4',
    url: 'https://leaf.example/sayaka',
  };

  it('coerces the typed numbers and uppercases the currency', () => {
    expect(listingSchema.parse(valid)).toEqual({
      ...valid,
      price: 32.5,
      currency: 'SGD',
      stock: 4,
    });
  });

  it('rejects a free listing, part units and a non-https link', () => {
    const result = listingSchema.safeParse({
      ...valid,
      price: '0',
      stock: '1.5',
      url: 'http://x.y',
    });
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(['price', 'stock', 'url']);
  });
});
