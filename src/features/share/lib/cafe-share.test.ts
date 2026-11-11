import { describe, expect, it } from 'vitest';

import { cafeJsonLd, drinkJsonLd } from './json-ld';
import { cafeMetadata, drinkMetadata } from './metadata';

const cafe = {
  slug: 'kurasu-bugis',
  name: 'Kurasu',
  area: 'Bugis',
  address: '1 Bugis St',
  lat: 1.3,
  lng: 103.85,
  instagramHandle: 'kurasu',
  websiteUrl: 'https://kurasu.test',
  tasterAvg: 4.26,
  tasterCount: 3,
  photoUrl: 'https://example.test/c.jpg',
  menu: [
    { name: 'Hojicha Latte', slug: 'hojicha-latte', price: 7.5, currency: 'SGD' },
    { name: 'Matcha Float', slug: 'matcha-float', price: null, currency: 'SGD' },
  ],
};

describe('cafeJsonLd', () => {
  it('describes the café with an aggregateRating from the taster score', () => {
    expect(cafeJsonLd(cafe)).toMatchObject({
      '@type': 'CafeOrCoffeeShop',
      name: 'Kurasu',
      address: '1 Bugis St',
      sameAs: ['https://www.instagram.com/kurasu/'],
      geo: { '@type': 'GeoCoordinates', latitude: 1.3, longitude: 103.85 },
      aggregateRating: { ratingValue: 4.3, reviewCount: 3, bestRating: 5, worstRating: 1 },
    });
  });

  it('omits aggregateRating without taster score', () => {
    expect(cafeJsonLd({ ...cafe, tasterAvg: null, tasterCount: 0 })).not.toHaveProperty(
      'aggregateRating'
    );
    expect(cafeJsonLd({ ...cafe, tasterAvg: 4, tasterCount: 0 })).not.toHaveProperty(
      'aggregateRating'
    );
  });

  it('adds a drink photo as the image and a priced menu from its drinks', () => {
    const ld = cafeJsonLd(cafe);
    expect(ld.image).toBe('https://example.test/c.jpg');
    expect(cafeJsonLd({ ...cafe, photoUrl: null })).not.toHaveProperty('image');
    expect(ld).toMatchObject({
      hasMenu: {
        '@type': 'Menu',
        hasMenuSection: {
          hasMenuItem: [
            {
              name: 'Hojicha Latte',
              offers: { '@type': 'Offer', price: '7.50', priceCurrency: 'SGD' },
            },
            { name: 'Matcha Float' },
          ],
        },
      },
    });
    const items = (ld.hasMenu as { hasMenuSection: { hasMenuItem: object[] } }).hasMenuSection
      .hasMenuItem;
    expect(items[1]).not.toHaveProperty('offers');
  });

  it('leaves hasMenu out for a café with no drinks', () => {
    expect(cafeJsonLd({ ...cafe, menu: [] })).not.toHaveProperty('hasMenu');
  });

  it('omits what the café does not have', () => {
    const ld = cafeJsonLd({
      ...cafe,
      address: null,
      lat: null,
      lng: null,
      instagramHandle: null,
      websiteUrl: null,
    });
    for (const key of ['address', 'geo', 'sameAs', 'url']) expect(ld).not.toHaveProperty(key);
  });
});

const drink = {
  name: 'Hojicha Latte',
  cafeName: 'Kurasu',
  cafeSlug: 'k',
  slug: 'h',
  photoUrl: 'https://example.test/h.jpg',
  price: 7.5,
  currency: 'SGD',
};

describe('drinkJsonLd', () => {
  it('is a MenuItem at the café with no rating claim', () => {
    const ld = drinkJsonLd(drink);
    expect(ld).toMatchObject({ '@type': 'MenuItem', name: 'Hojicha Latte' });
    expect(ld).not.toHaveProperty('aggregateRating');
  });

  it('uses the photo and the price when it has them', () => {
    expect(drinkJsonLd(drink)).toMatchObject({
      image: 'https://example.test/h.jpg',
      offers: { '@type': 'Offer', price: '7.50', priceCurrency: 'SGD' },
    });
  });

  it('omits image and offers when the drink has no photo or price', () => {
    const ld = drinkJsonLd({ ...drink, photoUrl: null, price: null });
    expect(ld).not.toHaveProperty('image');
    expect(ld).not.toHaveProperty('offers');
  });
});

describe('cafeMetadata / drinkMetadata', () => {
  it('titles the café with its area and describes taster score', () => {
    const meta = cafeMetadata({
      ...cafe,
      cityName: 'Singapore',
      drinkCount: 4,
      status: 'approved',
    });
    expect(meta.title).toBe('Kurasu · Bugis');
    expect(meta.description).toContain('4.3 out of 5 from 3 taster reviews');
    expect(String(meta.openGraph?.url)).toMatch(/\/cafes\/kurasu-bugis$/);
    expect(meta.robots).toBeUndefined();
  });

  it('noindexes a café that is not approved and says when unrated', () => {
    const meta = cafeMetadata({
      ...cafe,
      area: null,
      tasterAvg: null,
      tasterCount: 0,
      cityName: 'Singapore',
      drinkCount: 0,
      status: 'pending',
    });
    expect(meta.title).toBe('Kurasu');
    expect(meta.robots).toEqual({ index: false });
    expect(meta.description).toContain('Not yet rated');
  });

  it('titles a drink with its café and cites the taster score, never a blend', () => {
    const meta = drinkMetadata({
      name: 'Hojicha Latte',
      slug: 'hojicha-latte',
      cafeName: 'Kurasu',
      cafeSlug: 'kurasu-bugis',
      status: 'approved',
      tasterAvg: 4.5,
      tasterCount: 1,
      communityAvg: 2,
      communityCount: 9,
    });
    expect(meta.title).toBe('Hojicha Latte · Kurasu');
    expect(meta.description).toContain('4.5 out of 5 from 1 taster review');
    expect(meta.description).not.toContain('2.0');
    expect(String(meta.openGraph?.url)).toMatch(/\/cafes\/kurasu-bugis\/hojicha-latte$/);
  });

  it('falls back to the community score, labelled, and to unrated', () => {
    const base = {
      name: 'X',
      slug: 'x',
      cafeName: 'C',
      cafeSlug: 'c',
      status: 'pending' as const,
      tasterAvg: null,
      tasterCount: 0,
    };
    expect(drinkMetadata({ ...base, communityAvg: 3.5, communityCount: 3 }).description).toContain(
      '3.5 out of 5 from 3 community reviews'
    );
    const unrated = drinkMetadata({ ...base, communityAvg: null, communityCount: 0 });
    expect(unrated.description).toContain('Not yet rated');
    expect(unrated.robots).toEqual({ index: false });
  });
});
