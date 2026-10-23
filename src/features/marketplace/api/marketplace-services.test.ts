import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  deleteListing,
  listProductOffers,
  listVendorListings,
  saveListing,
} from './listing-service';
import { applyAsVendor, getMyVendor, updateVendor } from './vendor-service';

const vendorRow = {
  id: 'v1',
  name: 'Kyoto Leaf',
  profile_info: null,
  website: 'https://leaf.example',
  country: 'JP',
  ships_to: ['SG', 'JP'],
  status: 'approved',
};

const listingRow = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  vendor_id: 'v1',
  product_id: 'p1',
  price: '32.50',
  currency: 'SGD',
  stock: 4,
  url: 'https://leaf.example/sayaka',
  updated_at: '2026-10-24T00:00:00Z',
  ...overrides,
});

const vendorValues = { name: 'Kyoto Leaf', country: 'JP', shipsTo: ['SG', 'JP'] };
const listingValues = {
  productId: 'p1',
  price: 32.5,
  currency: 'SGD',
  stock: 4,
  url: 'https://leaf.example/sayaka',
};

describe('vendor service', () => {
  it('reads the user’s own shop, or null before they apply', async () => {
    const found = createFakeSupabase({ vendors: { data: vendorRow, error: null } });
    expect(await getMyVendor(found.client, 'u1')).toMatchObject({
      id: 'v1',
      shipsTo: ['SG', 'JP'],
      status: 'approved',
    });
    expect(found.calls).toContainEqual({ table: 'vendors', method: 'eq', args: ['user_id', 'u1'] });

    const none = createFakeSupabase({ vendors: { data: null, error: null } });
    expect(await getMyVendor(none.client, 'u1')).toBeNull();
  });

  it('applies without sending a status, so the database keeps it pending', async () => {
    const { client, calls } = createFakeSupabase({
      vendors: { data: { ...vendorRow, status: 'pending' }, error: null },
    });
    expect((await applyAsVendor(client, 'u1', vendorValues)).status).toBe('pending');
    expect(calls).toContainEqual({
      table: 'vendors',
      method: 'insert',
      args: [
        {
          user_id: 'u1',
          name: 'Kyoto Leaf',
          profile_info: null,
          website: null,
          country: 'JP',
          ships_to: ['SG', 'JP'],
        },
      ],
    });
  });

  it('throws the Supabase error on update', async () => {
    const error = new Error('denied');
    const { client } = createFakeSupabase({ vendors: { data: null, error } });
    await expect(updateVendor(client, 'v1', vendorValues)).rejects.toBe(error);
  });
});

describe('listing service', () => {
  it('lists a vendor’s listings with their teas, coercing the price', async () => {
    const { client } = createFakeSupabase({
      listings: { data: [listingRow('l1')], error: null },
      products: {
        data: [{ id: 'p1', name: 'Sayaka', brand: 'Ippodo', category: 'matcha' }],
        error: null,
      },
    });
    expect(await listVendorListings(client, 'v1')).toEqual([
      {
        id: 'l1',
        productId: 'p1',
        price: 32.5,
        currency: 'SGD',
        stock: 4,
        url: 'https://leaf.example/sayaka',
        updatedAt: '2026-10-24T00:00:00Z',
        product: { id: 'p1', name: 'Sayaka', brand: 'Ippodo', category: 'matcha' },
      },
    ]);
  });

  it('inserts a new listing and updates an existing one', async () => {
    const insert = createFakeSupabase({ listings: { data: listingRow('l1'), error: null } });
    await saveListing(insert.client, 'v1', listingValues);
    expect(insert.calls.some((c) => c.method === 'insert')).toBe(true);

    const update = createFakeSupabase({ listings: { data: listingRow('l1'), error: null } });
    await saveListing(update.client, 'v1', listingValues, 'l1');
    expect(update.calls).toContainEqual({ table: 'listings', method: 'eq', args: ['id', 'l1'] });
    expect(update.calls.some((c) => c.method === 'insert')).toBe(false);
  });

  it('throws when a delete is refused', async () => {
    const error = new Error('rls');
    const { client } = createFakeSupabase({ listings: { data: null, error } });
    await expect(deleteListing(client, 'l1')).rejects.toBe(error);
  });

  it('builds offers from approved vendors, in stock first and cheapest first per currency', async () => {
    const { client } = createFakeSupabase({
      listings: {
        data: [
          listingRow('sold-out', { price: '20.00', stock: 0 }),
          listingRow('dear', { price: '40.00' }),
          listingRow('cheap', { price: '30.00' }),
          listingRow('orphan', { vendor_id: 'gone' }),
        ],
        error: null,
      },
      vendors: { data: [vendorRow], error: null },
    });

    const offers = await listProductOffers(client, 'p1');
    expect(offers.map((o) => o.id)).toEqual(['cheap', 'dear', 'sold-out']);
    expect(offers[0].vendor).toEqual({
      id: 'v1',
      name: 'Kyoto Leaf',
      country: 'JP',
      shipsTo: ['SG', 'JP'],
      website: 'https://leaf.example',
    });
  });

  it('has no offers for an unlisted tea and skips the vendor read', async () => {
    const { client, calls } = createFakeSupabase({ listings: { data: [], error: null } });
    expect(await listProductOffers(client, 'p1')).toEqual([]);
    expect(calls.some((c) => c.table === 'vendors')).toBe(false);
  });
});
