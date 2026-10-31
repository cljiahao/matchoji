import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  addToWishlist,
  getStash,
  isWishlisted,
  listWishlist,
  listWishlistIds,
  removeFromWishlist,
  setStash,
} from './wishlist-service';

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

  it('getStash reads the stash, or null when the tea is not saved', async () => {
    const saved = createFakeSupabase({
      wishlist: { data: { owned_quantity: 2, opened_on: '2026-10-19' }, error: null },
    });
    expect(await getStash(saved.client, 'u1', 'p1')).toEqual({
      ownedQuantity: 2,
      openedOn: '2026-10-19',
    });
    const missing = createFakeSupabase({ wishlist: { data: null, error: null } });
    expect(await getStash(missing.client, 'u1', 'p1')).toBeNull();
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

describe('listWishlistIds', () => {
  it('returns the saved product ids for the user', async () => {
    const { client, calls } = createFakeSupabase({
      wishlist: { data: [{ product_id: 'a' }, { product_id: 'b' }], error: null },
    });
    expect(await listWishlistIds(client, 'u1')).toEqual(['a', 'b']);
    expect(calls).toContainEqual({ table: 'wishlist', method: 'eq', args: ['user_id', 'u1'] });
  });

  it('throws Supabase errors', async () => {
    const error = new Error('rls');
    const { client } = createFakeSupabase({ wishlist: { data: null, error } });
    await expect(listWishlistIds(client, 'u1')).rejects.toBe(error);
  });
});

describe('stash', () => {
  it('comes back with each saved tea, and saves for the owner', async () => {
    const { client, calls } = createFakeSupabase({
      wishlist: [
        { data: [{ product_id: 'p1', owned_quantity: 2, opened_on: '2026-10-20' }], error: null },
        { data: null, error: null },
      ],
      products: {
        data: [{ id: 'p1', name: 'Sayaka', brand: null, category: 'matcha', status: 'approved' }],
        error: null,
      },
    });
    const [item] = await listWishlist(client, 'me');
    expect(item.stash).toEqual({ ownedQuantity: 2, openedOn: '2026-10-20' });

    await setStash(client, 'me', 'p1', { ownedQuantity: 0, openedOn: null });
    expect(calls.find((c) => c.method === 'update')?.args[0]).toEqual({
      owned_quantity: 0,
      opened_on: null,
    });
  });

  it('throws when the save is refused', async () => {
    const error = new Error('rls');
    const { client } = createFakeSupabase({ wishlist: { data: null, error } });
    await expect(setStash(client, 'me', 'p1', { ownedQuantity: 1, openedOn: null })).rejects.toBe(
      error
    );
  });
});
