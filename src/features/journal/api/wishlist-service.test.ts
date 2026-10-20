import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { addToWishlist, isWishlisted, listWishlist, removeFromWishlist } from './wishlist-service';

describe('wishlist service', () => {
  it('addToWishlist upserts and ignores a duplicate', async () => {
    const { client, calls } = createFakeSupabase({ wishlist: { data: null, error: null } });

    await addToWishlist(client, 'u1', 'p1');

    expect(calls).toContainEqual({
      table: 'wishlist',
      method: 'upsert',
      args: [
        { user_id: 'u1', product_id: 'p1' },
        { onConflict: 'user_id,product_id', ignoreDuplicates: true },
      ],
    });
  });

  it('removeFromWishlist deletes by user and product', async () => {
    const { client, calls } = createFakeSupabase({ wishlist: { data: null, error: null } });

    await removeFromWishlist(client, 'u1', 'p1');

    expect(calls.map((c) => c.method)).toEqual(['from', 'delete', 'eq', 'eq']);
    expect(calls).toContainEqual({ table: 'wishlist', method: 'eq', args: ['user_id', 'u1'] });
    expect(calls).toContainEqual({ table: 'wishlist', method: 'eq', args: ['product_id', 'p1'] });
  });

  it('isWishlisted reports whether the row exists', async () => {
    const saved = createFakeSupabase({ wishlist: { data: { product_id: 'p1' }, error: null } });
    expect(await isWishlisted(saved.client, 'u1', 'p1')).toBe(true);
    const missing = createFakeSupabase({ wishlist: { data: null, error: null } });
    expect(await isWishlisted(missing.client, 'u1', 'p1')).toBe(false);
  });

  it('listWishlist returns products in saved order, newest first', async () => {
    const { client } = createFakeSupabase({
      wishlist: { data: [{ product_id: 'b' }, { product_id: 'a' }], error: null },
      products: {
        data: [
          { id: 'a', name: 'Uji', brand: null, category: 'matcha' },
          { id: 'b', name: 'Bancha', brand: 'Ippodo', category: 'hojicha' },
        ],
        error: null,
      },
    });

    expect((await listWishlist(client, 'u1')).map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('listWishlist skips the product lookup when nothing is saved', async () => {
    const { client, calls } = createFakeSupabase({ wishlist: { data: [], error: null } });
    expect(await listWishlist(client, 'u1')).toEqual([]);
    expect(calls.some((c) => c.table === 'products')).toBe(false);
  });

  it('throws Supabase errors', async () => {
    const error = new Error('rls');
    const { client } = createFakeSupabase({ wishlist: { data: null, error } });
    await expect(addToWishlist(client, 'u1', 'p1')).rejects.toBe(error);
    await expect(removeFromWishlist(client, 'u1', 'p1')).rejects.toBe(error);
    await expect(isWishlisted(client, 'u1', 'p1')).rejects.toBe(error);
    await expect(listWishlist(client, 'u1')).rejects.toBe(error);
  });
});
