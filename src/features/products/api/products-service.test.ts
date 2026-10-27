import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  getProduct,
  listGradeOptions,
  listProducts,
  listRegionSummaries,
  listRegions,
  searchProducts,
} from './products-service';

const row = (id: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  id,
  name: `Tea ${id}`,
  brand: null,
  category: 'matcha',
  grade: null,
  region_id: null,
  image_url: null,
  created_at: '2026-09-01T00:00:00Z',
  ...overrides,
});

const tea = (id: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  id,
  name: `Tea ${id}`,
  brand: null,
  category: 'matcha',
  grade: null,
  region_name: null,
  supply: null,
  image_url: null,
  shop_url: null,
  created_at: '2026-09-01T00:00:00Z',
  review_count: 0,
  avg_stars: null,
  ...overrides,
});

describe('listProducts', () => {
  it('maps catalogue rows, coercing numbers, and reports the total', async () => {
    const { client } = createFakeSupabase({
      catalogue_teas: {
        data: [
          tea('b', {
            region_name: 'Uji, Kyoto',
            supply: 'scarce',
            review_count: 2,
            avg_stars: '4.50',
          }),
          tea('a'),
        ],
        count: 30,
        error: null,
      },
      tea_taste_profiles: { data: [], error: null },
    });

    const { products, total } = await listProducts(client, { sort: 'top' });

    expect(total).toBe(30);
    expect(products.map((p) => p.id)).toEqual(['b', 'a']);
    expect(products[0]).toMatchObject({
      regionName: 'Uji, Kyoto',
      supply: 'scarce',
      avgStars: 4.5,
      reviewCount: 2,
      status: 'approved',
    });
    expect(products[1]).toMatchObject({ avgStars: null, reviewCount: 0, price: null });
  });

  it('carries each tea’s price per gram and band', async () => {
    const { client } = createFakeSupabase({
      catalogue_teas: {
        data: [tea('a', { price_sgd: '32.00', pack_grams: '40.0', price_band: 'premium' })],
        error: null,
      },
    });
    const { products } = await listProducts(client, { sort: 'top' });
    expect(products[0].price).toEqual({ sgd: 32, packGrams: 40, perGram: 0.8, band: 'premium' });
  });

  it('sorts by lowest price per gram, unpriced teas last', async () => {
    const { client, calls } = createFakeSupabase({ catalogue_teas: { data: [], error: null } });
    await listProducts(client, { sort: 'value' });
    expect(calls).toContainEqual({
      table: 'catalogue_teas',
      method: 'order',
      args: ['price_per_gram', { ascending: true, nullsFirst: false }],
    });
  });

  it('adds each rated tea’s two most-noticed flavour notes, reading this page only', async () => {
    const { client, calls } = createFakeSupabase({
      catalogue_teas: {
        data: [tea('a', { review_count: 3, avg_stars: 4 }), tea('b')],
        error: null,
      },
      tea_taste_profiles: {
        data: [{ product_id: 'a', notes: { umami: 2, creamy: 3, sweet: 1 } }],
        error: null,
      },
    });

    const { products } = await listProducts(client, { sort: 'top' });
    expect(products[0].topNotes).toEqual(['creamy', 'umami']);
    expect(calls).toContainEqual({
      table: 'tea_taste_profiles',
      method: 'in',
      args: ['product_id', ['a']],
    });
  });

  it('filters and pages in SQL', async () => {
    const { client, calls } = createFakeSupabase({ catalogue_teas: { data: [], error: null } });
    const regionId = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';

    await listProducts(client, {
      q: 'uji',
      category: 'matcha',
      regionId,
      grade: ' Ceremonial ',
      minRating: 4,
      sort: 'newest',
      page: 3,
    });

    const of = (method: string) => calls.filter((c) => c.method === method).map((c) => c.args);
    expect(of('or')).toEqual([['name.ilike.%uji%,brand.ilike.%uji%']]);
    expect(of('eq')).toEqual([
      ['category', 'matcha'],
      ['region_id', regionId],
      ['grade_key', 'ceremonial'],
    ]);
    expect(of('gte')).toEqual([['avg_stars', 4]]);
    expect(of('order')).toEqual([['created_at', { ascending: false, nullsFirst: false }]]);
    expect(of('range')).toEqual([[48, 71]]);
  });

  it('ranks "top" by weighted score and "scarce" by supply first', async () => {
    const top = createFakeSupabase({ catalogue_teas: { data: [], error: null } });
    await listProducts(top.client, { sort: 'top' }, { limit: 12 });
    expect(top.calls.filter((c) => c.method === 'order').map((c) => c.args[0])).toEqual([
      'top_rank',
      'weighted_score',
      'created_at',
    ]);
    expect(top.calls.find((c) => c.method === 'range')?.args).toEqual([0, 11]);

    const scarce = createFakeSupabase({ catalogue_teas: { data: [], error: null } });
    await listProducts(scarce.client, { sort: 'scarce' });
    expect(scarce.calls.filter((c) => c.method === 'order').map((c) => c.args[0])).toEqual([
      'supply_rank',
      'top_rank',
      'weighted_score',
      'created_at',
    ]);
  });

  it('throws the Supabase error', async () => {
    const error = new Error('rls denied');
    const { client } = createFakeSupabase({ catalogue_teas: { data: null, error } });
    await expect(listProducts(client, { sort: 'top' })).rejects.toBe(error);
  });
});

describe('listGradeOptions', () => {
  it('lists distinct grades among teas matching everything but grade and rating', async () => {
    const { client, calls } = createFakeSupabase({
      catalogue_teas: {
        data: [{ grade: 'Ceremonial' }, { grade: 'ceremonial ' }, { grade: 'Koicha' }],
        error: null,
      },
    });

    expect(
      await listGradeOptions(client, {
        category: 'matcha',
        grade: 'Koicha',
        minRating: 4,
        sort: 'top',
      })
    ).toEqual(['Ceremonial', 'Koicha']);
    expect(calls.filter((c) => c.method === 'eq').map((c) => c.args)).toEqual([
      ['category', 'matcha'],
    ]);
    expect(calls.some((c) => c.method === 'gte')).toBe(false);
  });
});

describe('getProduct', () => {
  it('returns null for an unknown id', async () => {
    const { client } = createFakeSupabase({ products: { data: null, error: null } });
    expect(await getProduct(client, 'missing')).toBeNull();
  });

  it('returns the hydrated product', async () => {
    const { client } = createFakeSupabase({
      products: { data: row('a'), error: null },
      product_ratings: { data: { product_id: 'a', avg_stars: 3, review_count: 1 }, error: null },
    });
    expect(await getProduct(client, 'a')).toMatchObject({ id: 'a', avgStars: 3 });
  });

  it('carries the photo credit', async () => {
    const { client } = createFakeSupabase({
      products: { data: row('a', { image_credit: 'Marukyu Koyamaen' }), error: null },
      product_ratings: { data: null, error: null },
    });
    expect(await getProduct(client, 'a')).toMatchObject({ imageCredit: 'Marukyu Koyamaen' });
  });

  it('throws the Supabase error', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ products: { data: null, error } });
    await expect(getProduct(client, 'a')).rejects.toBe(error);
  });
});

describe('listRegions', () => {
  it('returns regions ordered by name', async () => {
    const regions = [{ id: 'r1', name: 'Uji, Kyoto' }];
    const { client, calls } = createFakeSupabase({ regions: { data: regions, error: null } });

    expect(await listRegions(client)).toEqual(regions);
    expect(calls).toContainEqual({ table: 'regions', method: 'order', args: ['name'] });
  });

  it('throws the Supabase error', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ regions: { data: null, error } });
    await expect(listRegions(client)).rejects.toBe(error);
  });
});

describe('listRegionSummaries', () => {
  const region = {
    id: 'r1',
    name: 'Uji, Kyoto',
    prefecture: 'Kyoto',
    scarcity_note: null,
    matcha_supply: 'scarce',
    hojicha_supply: null,
  };

  it('counts each region’s teas from products that have a region', async () => {
    const { client, calls } = createFakeSupabase({
      regions: { data: [region], error: null },
      products: { data: [{ region_id: 'r1', category: 'hojicha' }], error: null },
    });

    expect(await listRegionSummaries(client)).toEqual([
      {
        id: 'r1',
        name: 'Uji, Kyoto',
        prefecture: 'Kyoto',
        scarcityNote: null,
        supply: { matcha: 'scarce', hojicha: null },
        counts: { matcha: 0, hojicha: 1 },
      },
    ]);
    expect(calls).toContainEqual({
      table: 'products',
      method: 'not',
      args: ['region_id', 'is', null],
    });
    expect(calls).toContainEqual({ table: 'products', method: 'eq', args: ['status', 'approved'] });
  });

  it('throws when either read fails', async () => {
    const error = new Error('boom');
    const regionsFail = createFakeSupabase({
      regions: { data: null, error },
      products: { data: [], error: null },
    });
    await expect(listRegionSummaries(regionsFail.client)).rejects.toBe(error);

    const productsFail = createFakeSupabase({
      regions: { data: [region], error: null },
      products: { data: null, error },
    });
    await expect(listRegionSummaries(productsFail.client)).rejects.toBe(error);
  });
});

describe('searchProducts', () => {
  it('does not query for blank input', async () => {
    const { client, calls } = createFakeSupabase({});
    expect(await searchProducts(client, '  ')).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('asks the search_teas function, which ranks typo-tolerant matches', async () => {
    const hits = [{ id: 'a', name: 'Uji', brand: null, category: 'matcha' }];
    const { client, calls } = createFakeSupabase({
      'rpc:search_teas': { data: hits, error: null },
    });

    expect(await searchProducts(client, 'uji')).toEqual(hits);
    expect(calls).toEqual([{ table: 'rpc:search_teas', method: 'rpc', args: [{ q: 'uji' }] }]);
  });

  it('throws the Supabase error', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ 'rpc:search_teas': { data: null, error } });
    await expect(searchProducts(client, 'uji')).rejects.toBe(error);
  });
});
