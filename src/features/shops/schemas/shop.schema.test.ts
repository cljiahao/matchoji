import { describe, expect, it } from 'vitest';

import { shopSchema } from './shop.schema';

const valid = {
  brand: 'Ippodo',
  name: 'Ippodo Tea Kyoto Main Store',
  kind: 'maker_store',
  address: '52 Tokiwagi-cho, Nakagyo-ku, Kyoto 604-0915',
  city: 'Kyoto',
  country: 'Japan',
  lat: '35.0144549',
  lng: '135.7675573',
  sourceUrl: 'https://global.ippodo-tea.co.jp/pages/store-kyoto',
};

describe('shopSchema', () => {
  it('accepts a complete shop and coerces the coordinates', () => {
    expect(shopSchema.parse(valid)).toMatchObject({ lat: 35.0144549, lng: 135.7675573 });
  });

  it('bounds latitude to ±90 and longitude to ±180', () => {
    for (const bad of [{ lat: '90.1' }, { lat: '-91' }, { lng: '180.5' }, { lng: '-181' }]) {
      expect(shopSchema.safeParse({ ...valid, ...bad }).success).toBe(false);
    }
    expect(shopSchema.safeParse({ ...valid, lat: '-90', lng: '180' }).success).toBe(true);
  });

  it('requires an https source link', () => {
    for (const sourceUrl of ['', 'http://example.com', 'ftp://example.com', 'not a url']) {
      expect(shopSchema.safeParse({ ...valid, sourceUrl }).success).toBe(false);
    }
  });

  it('refuses a blank name, an unknown kind and non-numeric coordinates', () => {
    expect(shopSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false);
    expect(shopSchema.safeParse({ ...valid, kind: 'farm' }).success).toBe(false);
    expect(shopSchema.safeParse({ ...valid, lat: 'north' }).success).toBe(false);
  });
});
