import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { listMyReviews } from './journal-service';

const row = (id: string, productId: string) => ({
  id,
  product_id: productId,
  user_id: 'u1',
  stars: 4,
  notes: null,
  photo_url: null,
  created_at: '2026-10-01T00:00:00Z',
  flavor_notes: [],
  sweetness: null,
  umami: null,
  bitterness: null,
  body: null,
  prep_method: null,
  dose_g: null,
  water_ml: null,
  water_temp_c: null,
  tasted_on: '2026-10-01',
});

describe('listMyReviews', () => {
  it('reads the user’s tastings newest first with their products', async () => {
    const { client, calls } = createFakeSupabase({
      reviews: { data: [row('r1', 'p1'), row('r2', 'p2')], error: null },
      products: {
        data: [
          { id: 'p2', name: 'Bancha', brand: null, category: 'hojicha' },
          { id: 'p1', name: 'Uji', brand: null, category: 'matcha' },
        ],
        error: null,
      },
    });

    const entries = await listMyReviews(client, 'u1');

    expect(calls).toContainEqual({ table: 'reviews', method: 'eq', args: ['user_id', 'u1'] });
    expect(calls).toContainEqual({
      table: 'reviews',
      method: 'order',
      args: ['tasted_on', { ascending: false }],
    });
    expect(entries.map((e) => [e.id, e.product.name])).toEqual([
      ['r1', 'Uji'],
      ['r2', 'Bancha'],
    ]);
  });

  it('skips the product lookup for an empty journal', async () => {
    const { client, calls } = createFakeSupabase({ reviews: { data: [], error: null } });
    expect(await listMyReviews(client, 'u1')).toEqual([]);
    expect(calls.some((c) => c.table === 'products')).toBe(false);
  });

  it('throws Supabase errors', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ reviews: { data: null, error } });
    await expect(listMyReviews(client, 'u1')).rejects.toBe(error);
  });
});
