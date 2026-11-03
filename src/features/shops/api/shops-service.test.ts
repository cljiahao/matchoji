import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { createShop, deleteShop, hasShopsForBrand, listShops, updateShop } from './shops-service';

const row = {
  id: 's1',
  brand: 'Ippodo',
  name: 'Kyoto Main Store',
  kind: 'maker_store',
  address: '52 Tokiwagi-cho',
  city: 'Kyoto',
  country: 'Japan',
  lat: 35.01,
  lng: 135.76,
  source_url: 'https://example.com/kyoto',
  checked_at: '2026-11-03',
};

const values = {
  brand: 'Ippodo',
  name: 'Kyoto Main Store',
  kind: 'maker_store' as const,
  address: '52 Tokiwagi-cho',
  city: 'Kyoto',
  country: 'Japan',
  lat: 35.01,
  lng: 135.76,
  sourceUrl: 'https://example.com/kyoto',
};

describe('listShops', () => {
  it('maps rows to shops', async () => {
    const { client } = createFakeSupabase({ shop_locations: { data: [row], error: null } });
    expect(await listShops(client)).toEqual([
      {
        id: 's1',
        brand: 'Ippodo',
        name: 'Kyoto Main Store',
        kind: 'maker_store',
        address: '52 Tokiwagi-cho',
        city: 'Kyoto',
        country: 'Japan',
        lat: 35.01,
        lng: 135.76,
        sourceUrl: 'https://example.com/kyoto',
        checkedAt: '2026-11-03',
      },
    ]);
  });

  it('is empty until the migration is applied', async () => {
    for (const code of ['42P01', 'PGRST205']) {
      const { client } = createFakeSupabase({
        shop_locations: { data: null, error: { code, message: 'missing' } },
      });
      expect(await listShops(client)).toEqual([]);
    }
  });

  it('throws any other error', async () => {
    const error = { code: '42501', message: 'denied' };
    const { client } = createFakeSupabase({ shop_locations: { data: null, error } });
    await expect(listShops(client)).rejects.toBe(error);
  });
});

describe('hasShopsForBrand', () => {
  it('matches the maker without regard to case and escapes wildcards', async () => {
    const { client, calls } = createFakeSupabase({
      shop_locations: { data: null, error: null, count: 2 },
    });
    expect(await hasShopsForBrand(client, '100%_Tea')).toBe(true);
    expect(calls).toContainEqual({
      table: 'shop_locations',
      method: 'ilike',
      args: ['brand', '100\\%\\_Tea'],
    });
  });

  it('is false with no match or no table', async () => {
    const none = createFakeSupabase({ shop_locations: { data: null, error: null, count: 0 } });
    expect(await hasShopsForBrand(none.client, 'Aiya')).toBe(false);
    const missing = createFakeSupabase({
      shop_locations: { data: null, error: { code: '42P01', message: 'x' } },
    });
    expect(await hasShopsForBrand(missing.client, 'Aiya')).toBe(false);
  });
});

describe('shop writes', () => {
  it('inserts snake_case columns', async () => {
    const { client, calls } = createFakeSupabase({ shop_locations: { data: null, error: null } });
    await createShop(client, values);
    const insert = calls.find((c) => c.method === 'insert');
    expect(insert?.args[0]).toMatchObject({
      brand: 'Ippodo',
      source_url: 'https://example.com/kyoto',
    });
  });

  it('updates and deletes by id', async () => {
    const { client, calls } = createFakeSupabase({ shop_locations: { data: null, error: null } });
    await updateShop(client, 's1', values);
    await deleteShop(client, 's1');
    expect(calls.filter((c) => c.method === 'eq')).toEqual([
      { table: 'shop_locations', method: 'eq', args: ['id', 's1'] },
      { table: 'shop_locations', method: 'eq', args: ['id', 's1'] },
    ]);
    expect(calls.some((c) => c.method === 'update')).toBe(true);
    expect(calls.some((c) => c.method === 'delete')).toBe(true);
  });

  it('throws the Supabase error', async () => {
    const error = new Error('denied');
    const { client } = createFakeSupabase({ shop_locations: { data: null, error } });
    await expect(createShop(client, values)).rejects.toBe(error);
    await expect(deleteShop(client, 's1')).rejects.toBe(error);
  });
});
