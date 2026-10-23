import { describe, expect, it } from 'vitest';

import { buildTasteProfile, type Tasting } from './taste-profile';

const tasting = (
  id: string,
  stars: number,
  overrides: Partial<Omit<Tasting, 'product'>> & { category?: 'matcha' | 'hojicha' } = {}
): Tasting => ({
  product: { id, category: overrides.category ?? 'matcha' },
  stars,
  flavorNotes: overrides.flavorNotes ?? [],
  profile: overrides.profile ?? {},
  prep: overrides.prep ?? { method: null },
});

describe('buildTasteProfile', () => {
  it('uses each tea’s latest tasting and flags fewer than 5 teas as early', () => {
    const profile = buildTasteProfile([
      tasting('a', 2),
      tasting('a', 5),
      tasting('b', 4, { category: 'hojicha' }),
    ]);
    expect(profile.ratedTeas).toBe(2);
    expect(profile.early).toBe(true);
    expect(profile.byCategory).toEqual({
      matcha: { teas: 1, avgStars: 2 },
      hojicha: { teas: 1, avgStars: 4 },
    });
  });

  it('finds favourite notes, liked versus disliked taste, and preferred preparation', () => {
    const profile = buildTasteProfile([
      tasting('a', 5, {
        flavorNotes: ['umami', 'creamy'],
        profile: { umami: 5, bitterness: 1 },
        prep: { method: 'usucha' },
      }),
      tasting('b', 4, {
        flavorNotes: ['umami', 'sweet'],
        profile: { umami: 4 },
        prep: { method: 'usucha' },
      }),
      tasting('c', 1, {
        flavorNotes: ['astringent'],
        profile: { bitterness: 5 },
        prep: { method: 'latte' },
      }),
      tasting('d', 3),
      tasting('e', 4),
    ]);

    expect(profile.early).toBe(false);
    expect(profile.favouriteNotes).toEqual(['umami', 'creamy', 'sweet']);
    expect(profile.liked).toEqual({ umami: 4.5, bitterness: 1 });
    expect(profile.disliked).toEqual({ bitterness: 5 });
    expect(profile.favouritePrep).toBe('usucha');
  });

  it('is empty for someone who has not rated anything', () => {
    expect(buildTasteProfile([])).toMatchObject({
      ratedTeas: 0,
      early: true,
      favouriteNotes: [],
      favouritePrep: null,
    });
  });
});
