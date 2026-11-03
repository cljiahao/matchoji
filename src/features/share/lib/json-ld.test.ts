import { describe, expect, it } from 'vitest';

import { serializeJsonLd, teaJsonLd } from './json-ld';

const tea = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Samidori',
  brand: 'Ippodo',
  category: 'matcha',
  grade: 'Ceremonial',
  imageUrl: 'https://example.test/samidori.jpg',
  avgStars: 4.26,
  reviewCount: 12,
};

describe('teaJsonLd', () => {
  it('describes a rated tea as a Product with an aggregateRating', () => {
    expect(teaJsonLd(tea)).toMatchObject({
      '@type': 'Product',
      name: 'Samidori',
      brand: { '@type': 'Brand', name: 'Ippodo' },
      image: 'https://example.test/samidori.jpg',
      aggregateRating: { ratingValue: 4.3, reviewCount: 12, bestRating: 5, worstRating: 1 },
    });
  });

  it('omits aggregateRating while nobody has rated the tea', () => {
    expect(teaJsonLd({ ...tea, avgStars: null, reviewCount: 0 })).not.toHaveProperty(
      'aggregateRating'
    );
  });

  it('omits the brand, grade and image a tea does not have', () => {
    const ld = teaJsonLd({ ...tea, brand: null, grade: null, imageUrl: null });
    expect(ld).not.toHaveProperty('brand');
    expect(ld).not.toHaveProperty('description');
    expect(ld).not.toHaveProperty('image');
  });
});

describe('serializeJsonLd', () => {
  it('escapes "<" so a tea name cannot close the script element', () => {
    const json = serializeJsonLd(teaJsonLd({ ...tea, name: '</script><b>x' }));
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toBe('</script><b>x');
  });
});
