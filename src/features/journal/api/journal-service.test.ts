import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { teaEntries } from '../lib/journal-stats';
import { getPublicYear, listMyReviews, listUserTastings } from './journal-service';

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
    expect(teaEntries(entries).map((e) => [e.id, e.product.name])).toEqual([
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

describe('listUserTastings', () => {
  it('names each tea’s region and leaves unregioned teas null', async () => {
    const { client } = createFakeSupabase({
      reviews: { data: [row('r1', 'p1'), row('r2', 'p2')], error: null },
      products: {
        data: [
          {
            id: 'p1',
            name: 'Uji',
            brand: null,
            category: 'matcha',
            status: 'approved',
            region_id: 'g1',
          },
          {
            id: 'p2',
            name: 'Bancha',
            brand: null,
            category: 'hojicha',
            status: 'approved',
            region_id: null,
          },
        ],
        error: null,
      },
      regions: { data: [{ id: 'g1', name: 'Uji, Kyoto' }], error: null },
    });
    const entries = await listUserTastings(client, 'u1');
    expect(teaEntries(entries).map((e) => e.regionName)).toEqual(['Uji, Kyoto', null]);
    expect(teaEntries(entries)[0].product).not.toHaveProperty('region_id');
  });

  it('throws a regions error', async () => {
    const error = new Error('regions down');
    const { client } = createFakeSupabase({
      reviews: { data: [row('r1', 'p1')], error: null },
      products: {
        data: [{ id: 'p1', name: 'Uji', brand: null, category: 'matcha', region_id: 'g1' }],
        error: null,
      },
      regions: { data: null, error },
    });
    await expect(listUserTastings(client, 'u1')).rejects.toBe(error);
  });
});

describe('getPublicYear', () => {
  const days = ['2026-01-01', '2026-02-01', '2026-03-01'];
  const tastings = {
    reviews: {
      data: days.map((d, i) => ({ ...row(`r${i}`, `p${i}`), tasted_on: d })),
      error: null,
    },
    products: {
      data: days.map((_, i) => ({
        id: `p${i}`,
        name: `Tea ${i}`,
        brand: null,
        category: 'matcha',
        region_id: null,
      })),
      error: null,
    },
  };

  it('returns the recap of a public taster', async () => {
    const { client } = createFakeSupabase({
      public_profiles: { data: { display_name: 'Mei', is_public: true }, error: null },
      ...tastings,
    });
    const result = await getPublicYear(client, 'u1', 2026);
    expect(result?.taster).toBe('Mei');
    expect(result?.recap.tastings).toBe(3);
  });

  it('returns null for a private taster without reading their tastings', async () => {
    const { client, calls } = createFakeSupabase({
      public_profiles: { data: { display_name: 'Mei', is_public: false }, error: null },
    });
    expect(await getPublicYear(client, 'u1', 2026)).toBeNull();
    expect(calls.some((c) => c.table === 'reviews')).toBe(false);
  });

  it('returns null for an unknown taster and for a year below the threshold', async () => {
    const unknown = createFakeSupabase({ public_profiles: { data: null, error: null } });
    expect(await getPublicYear(unknown.client, 'u1', 2026)).toBeNull();
    const thin = createFakeSupabase({
      public_profiles: { data: { display_name: 'Mei', is_public: true }, error: null },
      ...tastings,
    });
    expect(await getPublicYear(thin.client, 'u1', 2020)).toBeNull();
  });
});

const drinkRow = (id: string, drinkId = 'd1') => ({
  ...row(id, 'unused'),
  product_id: null,
  drink_id: drinkId,
  instagram_url: 'https://www.instagram.com/p/Cabc123/',
  disclosure: 'gifted',
  tea_strength: 4,
  roast: 3,
  by_trusted_taster: true,
});

describe('listUserTastings with drink reviews', () => {
  it('lists drink and tea tastings together, naming the café', async () => {
    const { client, calls } = createFakeSupabase({
      reviews: { data: [drinkRow('r1'), row('r2', 'p1')], error: null },
      products: { data: [{ id: 'p1', name: 'Uji', brand: null, category: 'matcha' }], error: null },
      drinks: {
        data: [
          {
            id: 'd1',
            cafe_id: 'c1',
            slug: 'hojicha-latte',
            name: 'Hojicha Latte',
            base: 'hojicha',
          },
        ],
        error: null,
      },
      cafes: { data: [{ id: 'c1', slug: 'kurasu', name: 'Kurasu' }], error: null },
    });

    const entries = await listUserTastings(client, 'u1');

    expect(entries.map((e) => e.id)).toEqual(['r1', 'r2']);
    expect(entries[0]).toMatchObject({
      drinkId: 'd1',
      disclosure: 'gifted',
      drink: { name: 'Hojicha Latte', cafe: { name: 'Kurasu', slug: 'kurasu' } },
    });
    expect(entries[0]).not.toHaveProperty('product');
    // added_by and the review fields are not selectable, so only named columns are read.
    expect(
      calls.filter((c) => c.table === 'drinks' && c.method === 'select')[0].args[0]
    ).not.toContain('*');
    expect(calls).toContainEqual({ table: 'products', method: 'in', args: ['id', ['p1']] });
  });

  it('drops a drink review whose drink is no longer visible', async () => {
    const { client } = createFakeSupabase({
      reviews: { data: [drinkRow('r1')], error: null },
      products: { data: [], error: null },
      drinks: { data: [], error: null },
    });
    expect(await listUserTastings(client, 'u1')).toEqual([]);
  });

  it('shows no drink tastings, and does not throw, before the café migration is applied', async () => {
    const { client } = createFakeSupabase({
      reviews: { data: [drinkRow('r1'), row('r2', 'p1')], error: null },
      products: { data: [{ id: 'p1', name: 'Uji', brand: null, category: 'matcha' }], error: null },
      drinks: { data: null, error: { code: '42P01', message: 'missing' } },
    });
    expect((await listUserTastings(client, 'u1')).map((e) => e.id)).toEqual(['r2']);
  });

  it('throws other drink errors', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase({
      reviews: { data: [drinkRow('r1')], error: null },
      products: { data: [], error: null },
      drinks: { data: null, error },
    });
    await expect(listUserTastings(client, 'u1')).rejects.toBe(error);
  });
});
