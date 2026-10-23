import { describe, expect, it } from 'vitest';

import type { RatedTea, TeaFeatures } from '../types';
import { matchBand, predictMatch, teaSimilarity } from './match';

const tea = (id: string, overrides: Partial<TeaFeatures> = {}): TeaFeatures => ({
  id,
  name: id,
  category: 'matcha',
  grade: null,
  regionId: null,
  sliders: {},
  notes: {},
  ...overrides,
});

const umamiMatcha = (id: string) =>
  tea(id, {
    grade: 'koicha',
    sliders: { umami: 5, sweetness: 4, bitterness: 1, body: 4 },
    notes: { umami: 6, creamy: 4 },
  });
const roastyHojicha = (id: string) =>
  tea(id, {
    category: 'hojicha',
    sliders: { umami: 1, sweetness: 3, bitterness: 2, body: 2 },
    notes: { roasty: 5, caramel: 3 },
  });

describe('teaSimilarity', () => {
  it('is 1 for twins and low across categories and flavours', () => {
    expect(teaSimilarity(umamiMatcha('a'), umamiMatcha('b'))).toBeCloseTo(1);
    expect(teaSimilarity(umamiMatcha('a'), roastyHojicha('b'))).toBeLessThan(0.3);
  });

  it('weighs only what both teas have', () => {
    expect(teaSimilarity(tea('a'), tea('b'))).toBe(1);
    expect(teaSimilarity(tea('a'), tea('b', { category: 'hojicha' }))).toBe(0);
  });
});

describe('predictMatch', () => {
  const lovesUmami: RatedTea[] = [
    { tea: umamiMatcha('Sayaka'), stars: 5 },
    { tea: umamiMatcha('Unkaku'), stars: 5 },
    { tea: roastyHojicha('Gokujo'), stars: 2 },
  ];

  it('scores a tea like the ones you loved as a great match, and says why', () => {
    const result = predictMatch(lovesUmami, umamiMatcha('Kan'));
    expect(result?.score).toBeGreaterThanOrEqual(70);
    expect(result?.band).toBe('great');
    expect(result?.because.map((b) => b.name)).toEqual(['Sayaka', 'Unkaku']);
  });

  it('scores a tea like the one you disliked as a low match', () => {
    const result = predictMatch(lovesUmami, roastyHojicha('Organic'));
    expect(result?.score).toBeLessThan(40);
    expect(result?.band).toBe('low');
  });

  it('has nothing to say without ratings, or about a tea you rated yourself', () => {
    expect(predictMatch([], umamiMatcha('Kan'))).toBeNull();
    expect(predictMatch(lovesUmami, umamiMatcha('Sayaka'))).toBeNull();
  });

  it('leans toward your average when the evidence is thin', () => {
    const one: RatedTea[] = [{ tea: umamiMatcha('Sayaka'), stars: 5 }];
    const many: RatedTea[] = [
      { tea: umamiMatcha('Sayaka'), stars: 5 },
      { tea: umamiMatcha('Unkaku'), stars: 5 },
      { tea: umamiMatcha('Isuzu'), stars: 5 },
    ];
    const thin = predictMatch(one, umamiMatcha('Kan'))?.score ?? 0;
    const strong = predictMatch(many, umamiMatcha('Kan'))?.score ?? 0;
    expect(strong).toBeGreaterThanOrEqual(thin);
  });
});

describe('matchBand', () => {
  it('uses Vivino’s bands', () => {
    expect([100, 70, 69, 40, 39, 0].map(matchBand)).toEqual([
      'great',
      'great',
      'average',
      'average',
      'low',
      'low',
    ]);
  });
});
