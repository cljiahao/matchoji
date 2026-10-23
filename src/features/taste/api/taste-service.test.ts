import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { loadMatches } from './taste-service';

const products = [
  { id: 'sayaka', name: 'Sayaka', category: 'matcha', grade: 'Koicha ', region_id: null },
  { id: 'kan', name: 'Kan', category: 'matcha', grade: 'koicha', region_id: null },
  { id: 'bancha', name: 'Bancha', category: 'hojicha', grade: null, region_id: null },
];
const profiles = [
  {
    product_id: 'sayaka',
    umami: '5.00',
    sweetness: null,
    bitterness: '1.00',
    body: null,
    notes: { umami: 3 },
  },
  {
    product_id: 'kan',
    umami: '4.50',
    sweetness: null,
    bitterness: '1.50',
    body: null,
    notes: { umami: 2 },
  },
];

describe('loadMatches', () => {
  it('scores candidates from the taster’s latest ratings', async () => {
    const { client, calls } = createFakeSupabase({
      latest_reviews: { data: [{ product_id: 'sayaka', stars: 5 }], error: null },
      products: { data: products, error: null },
      tea_taste_profiles: { data: profiles, error: null },
    });

    const result = await loadMatches(client, 'u1', ['kan', 'sayaka']);

    expect(result.hasRatings).toBe(true);
    expect(result.ownStars.get('sayaka')).toBe(5);
    expect(result.matches.get('kan')).toMatchObject({
      band: 'great',
      because: [{ name: 'Sayaka', stars: 5 }],
    });
    expect(result.matches.get('sayaka')).toBeNull();
    expect(calls).toContainEqual({
      table: 'latest_reviews',
      method: 'eq',
      args: ['user_id', 'u1'],
    });
  });

  it('skips the feature reads for someone who has rated nothing', async () => {
    const { client, calls } = createFakeSupabase({ latest_reviews: { data: [], error: null } });
    const result = await loadMatches(client, 'u1', ['kan']);
    expect(result).toMatchObject({ hasRatings: false });
    expect(calls.some((c) => c.table === 'products')).toBe(false);
  });

  it('throws when a read fails', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase({
      latest_reviews: { data: [{ product_id: 'sayaka', stars: 5 }], error: null },
      products: { data: products, error: null },
      tea_taste_profiles: { data: null, error },
    });
    await expect(loadMatches(client, 'u1', ['kan'])).rejects.toBe(error);
  });
});
