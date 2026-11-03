import { describe, expect, it } from 'vitest';

import type { Shop } from '../types';
import { directionsUrl, distinct, filterShops, shopPins, shopsHref } from './shop-utils';

const shop = (over: Partial<Shop>): Shop => ({
  id: 'x',
  brand: 'Ippodo',
  name: 'Kyoto Main Store',
  kind: 'maker_store',
  address: '52 Tokiwagi-cho, Kyoto',
  city: 'Kyoto',
  country: 'Japan',
  lat: 35,
  lng: 135,
  sourceUrl: 'https://example.com',
  checkedAt: '2026-11-03',
  ...over,
});

const shops = [
  shop({ id: '1' }),
  shop({ id: '2', brand: 'Aiya', kind: 'stockist', country: 'Singapore', city: 'Singapore' }),
  shop({ id: '3', brand: 'Aiya', kind: 'cafe' }),
];

describe('filterShops', () => {
  it('passes everything with no filters', () => {
    expect(filterShops(shops, {})).toHaveLength(3);
  });

  it('filters by maker (any case), kind and country, together', () => {
    expect(filterShops(shops, { brand: 'aiya' }).map((s) => s.id)).toEqual(['2', '3']);
    expect(filterShops(shops, { kind: 'cafe' }).map((s) => s.id)).toEqual(['3']);
    expect(filterShops(shops, { country: 'Singapore' }).map((s) => s.id)).toEqual(['2']);
    expect(filterShops(shops, { brand: 'Aiya', country: 'Japan' }).map((s) => s.id)).toEqual(['3']);
    expect(filterShops(shops, { brand: 'Nobody' })).toEqual([]);
  });
});

describe('distinct', () => {
  it('lists each value once, sorted', () => {
    expect(distinct(shops, 'brand')).toEqual(['Aiya', 'Ippodo']);
    expect(distinct(shops, 'country')).toEqual(['Japan', 'Singapore']);
  });
});

describe('links', () => {
  it('builds an OpenStreetMap search from the name and address', () => {
    const url = new URL(directionsUrl(shops[0]));
    expect(url.origin + url.pathname).toBe('https://www.openstreetmap.org/search');
    expect(url.searchParams.get('query')).toBe('Kyoto Main Store, 52 Tokiwagi-cho, Kyoto');
  });

  it('links a maker to its shops, encoded', () => {
    expect(shopsHref('Marukyu Koyamaen')).toBe('/shops?brand=Marukyu+Koyamaen');
  });
});

describe('shopPins', () => {
  it('names each pin after its shop and offers directions in the popup', () => {
    const [pin] = shopPins([shops[0]]);
    expect(pin).toMatchObject({ name: 'Kyoto Main Store', lat: 35, lng: 135, text: 'I' });
    expect(pin.link?.label).toBe('Directions');
    expect(pin.description).toContain('Maker store');
  });
});
