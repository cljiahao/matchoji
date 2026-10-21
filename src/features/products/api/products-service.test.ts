import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { getProduct, listProducts, listRegions, searchProducts } from './products-service';

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
  it('merges region names and ratings, rated products first', async () => {
    const { client } = createFakeSupabase({
      products: { data: [row('a'), row('b', { region_id: 'r1' })], error: null },
      regions: { data: [{ id: 'r1', name: 'Uji, Kyoto' }], error: null },
      product_ratings: {
        data: [{ product_id: 'b', avg_stars: 4.5, review_count: 2 }],
        error: null,
      },
      reviews: { data: [], error: null },
    });

    const products = await listProducts(client, { sort: 'top' });

    expect(products.map((p) => p.id)).toEqual(['b', 'a']);
    expect(products[0]).toMatchObject({ regionName: 'Uji, Kyoto', avgStars: 4.5, reviewCount: 2 });
    expect(products[1]).toMatchObject({ regionName: null, avgStars: null, reviewCount: 0 });
  });

  it('adds each product’s two most-noticed flavour notes', async () => {
    const { client } = createFakeSupabase({
      products: { data: [row('a')], error: null },
      product_ratings: { data: [{ product_id: 'a', avg_stars: 4, review_count: 3 }], error: null },
      reviews: {
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

describe('searchProducts', () => {
  it('does not query for blank input', async () => {
    const { client, calls } = createFakeSupabase({});
    expect(await searchProducts(client, '  ')).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('queries with the sanitised name/brand filter', async () => {
    const hits = [{ id: 'a', name: 'Uji', brand: null, category: 'matcha' }];
    const { client, calls } = createFakeSupabase({ products: { data: hits, error: null } });

    expect(await searchProducts(client, 'uji,x')).toEqual(hits);
    expect(calls).toContainEqual({
      table: 'products',
      method: 'or',
      args: ['name.ilike.%uji x%,brand.ilike.%uji x%'],
    });
  });

  it('throws the Supabase error', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ products: { data: null, error } });
    await expect(searchProducts(client, 'uji')).rejects.toBe(error);
  });
});
