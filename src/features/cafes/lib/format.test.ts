import { describe, expect, it } from 'vitest';

import { formatPrice } from './format';
import { cafePins } from './pins';

describe('formatPrice', () => {
  it('uses the city currency', () => {
    expect(formatPrice(6.5, 'SGD')).toContain('6.50');
    expect(formatPrice(12, 'MYR')).toContain('12.00');
    expect(formatPrice(12, 'MYR')).toMatch(/RM/);
  });
});

describe('cafePins', () => {
  const base = {
    slug: 'a',
    name: 'A',
    area: null,
    address: null,
    instagramHandle: null,
    websiteUrl: null,
    status: 'approved' as const,
    citySlug: 'singapore' as const,
    scores: {
      tasterAvg: null,
      tasterCount: 0,
      tasterDisclosedCount: 0,
      communityAvg: null,
      communityCount: 0,
    },
  };

  it('pins only cafés with coordinates and links to the café page', () => {
    const pins = cafePins([
      { ...base, id: '1', lat: 1.3, lng: 103.8, drinkCount: 2 },
      { ...base, id: '2', lat: null, lng: null, drinkCount: 0 },
    ]);
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ id: '1', href: '/cafes/a', text: '2' });
  });
});
