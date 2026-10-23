import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  getProduct,
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

describe('listProducts', () => {
  it('merges region names, supply and ratings, rated products first', async () => {
    const { client } = createFakeSupabase({
      products: { data: [row('a'), row('b', { region_id: 'r1' })], error: null },
      regions: {
        data: [{ id: 'r1', name: 'Uji, Kyoto', matcha_supply: 'scarce', hojicha_supply: 'tight' }],
        error: null,
      },
      product_ratings: {
        data: [{ product_id: 'b', avg_stars: 4.5, review_count: 2 }],
        error: null,
      },
      latest_reviews: { data: [], error: null },
    });

    const products = await listProducts(client, { sort: 'top' });

    expect(products.map((p) => p.id)).toEqual(['b', 'a']);
    expect(products[0]).toMatchObject({
      regionName: 'Uji, Kyoto',
      supply: 'scarce',
      avgStars: 4.5,
      reviewCount: 2,
    });
    expect(products[1]).toMatchObject({
      regionName: null,
      supply: null,
      avgStars: null,
      reviewCount: 0,
    });
  });

  it('adds each product’s two most-noticed flavour notes', async () => {
    const { client } = createFakeSupabase({
      products: { data: [row('a')], error: null },
      product_ratings: { data: [{ product_id: 'a', avg_stars: 4, review_count: 3 }], error: null },
      latest_reviews: {
        data: [
          { product_id: 'a', flavor_notes: ['umami', 'creamy'] },
          { product_id: 'a', flavor_notes: ['creamy', 'sweet'] },
          { product_id: 'a', flavor_notes: ['creamy'] },
        ],
        error: null,
      },
    });

    const [product] = await listProducts(client, { sort: 'top' });
    expect(product.topNotes).toEqual(['creamy', 'umami']);
  });

  it('filters by category when one is given', async () => {
    const { client, calls } = createFakeSupabase({
      products: { data: [], error: null },
    });

    await listProducts(client, { category: 'hojicha', sort: 'top' });

    expect(calls).toContainEqual({
      table: 'products',
      method: 'eq',
      args: ['category', 'hojicha'],
    });
  });

  it('applies search, category and region filters', async () => {
    const { client, calls } = createFakeSupabase({ products: { data: [], error: null } });
    const regionId = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';

    await listProducts(client, { q: 'uji', category: 'matcha', regionId, sort: 'newest' });

    expect(calls).toContainEqual({
      table: 'products',
      method: 'or',
      args: ['name.ilike.%uji%,brand.ilike.%uji%'],
    });
    expect(calls).toContainEqual({ table: 'products', method: 'eq', args: ['category', 'matcha'] });
    expect(calls).toContainEqual({
      table: 'products',
      method: 'eq',
      args: ['region_id', regionId],
    });
  });

  it('skips the region lookup when no product has a region', async () => {
    const { client, calls } = createFakeSupabase({
      products: { data: [row('a')], error: null },
      product_ratings: { data: [], error: null },
    });

    await listProducts(client, { sort: 'top' });

    expect(calls.some((c) => c.table === 'regions')).toBe(false);
  });

  it('throws when ratings fail to load instead of showing teas as unrated', async () => {
    const error = new Error('ratings');
    const { client } = createFakeSupabase({
      products: { data: [row('a')], error: null },
      product_ratings: { data: null, error },
    });
    await expect(listProducts(client, { sort: 'top' })).rejects.toBe(error);
  });

  it('throws the Supabase error', async () => {
    const error = new Error('rls denied');
    const { client } = createFakeSupabase({ products: { data: null, error } });

    await expect(listProducts(client, { sort: 'top' })).rejects.toBe(error);
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
      product_ratings: { data: [{ product_id: 'a', avg_stars: 3, review_count: 1 }], error: null },
    });
    expect(await getProduct(client, 'a')).toMatchObject({ id: 'a', avgStars: 3 });
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

  it('queries with the sanitised name/brand filter', async () => {
    const hits = [{ id: 'a', name: 'Uji', brand: null, category: 'matcha' }];
    const { client, calls } = createFakeSupabase({
      products: {
        data: hits.map((h) => ({ ...h, status: 'approved', added_by: null })),
        error: null,
      },
    });

    expect(await searchProducts(client, 'uji,x')).toEqual(hits);
    expect(calls).toContainEqual({
      table: 'products',
      method: 'or',
      args: ['name.ilike.%uji x%,brand.ilike.%uji x%'],
    });
  });

  it('keeps other people’s pending teas out but finds the searcher’s own', async () => {
    const row = (id: string, status: string, added_by: string | null) => ({
      id,
      name: `Uji ${id}`,
      brand: null,
      category: 'matcha',
      status,
      added_by,
    });
    const rows = [
      row('approved', 'approved', null),
      row('mine', 'pending', 'u1'),
      row('theirs', 'pending', 'u2'),
    ];
    const { client, calls } = createFakeSupabase({
      products: [
        { data: rows, error: null },
        { data: rows, error: null },
      ],
    });

    expect((await searchProducts(client, 'uji', 'u1')).map((p) => p.id)).toEqual([
      'approved',
      'mine',
    ]);
    expect((await searchProducts(client, 'uji')).map((p) => p.id)).toEqual(['approved']);
    expect(calls).toContainEqual({
      table: 'products',
      method: 'neq',
      args: ['status', 'rejected'],
    });
  });

  it('throws the Supabase error', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ products: { data: null, error } });
    await expect(searchProducts(client, 'uji')).rejects.toBe(error);
  });
});
