import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  isAdmin,
  listReviewQueue,
  mergeTea,
  reviewShop,
  reviewTea,
  setTeaLinks,
} from './admin-service';

describe('isAdmin', () => {
  it('asks the database and treats anything but true as no', async () => {
    expect(
      await isAdmin(createFakeSupabase({ 'rpc:is_admin': { data: true, error: null } }).client)
    ).toBe(true);
    expect(
      await isAdmin(createFakeSupabase({ 'rpc:is_admin': { data: null, error: null } }).client)
    ).toBe(false);
  });

  it('throws the Supabase error', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase({ 'rpc:is_admin': { data: null, error } });
    await expect(isAdmin(client)).rejects.toBe(error);
  });
});

describe('listReviewQueue', () => {
  it('lists pending teas with who added them, and pending shops', async () => {
    const { client, calls } = createFakeSupabase({
      products: {
        data: [
          {
            id: 't1',
            name: 'Hoshi',
            brand: 'Farm',
            category: 'matcha',
            grade: null,
            added_by: 'u1',
            created_at: '2026-10-24T00:00:00Z',
          },
        ],
        error: null,
      },
      vendors: {
        data: [
          {
            id: 'v1',
            name: 'Leaf',
            country: 'JP',
            ships_to: ['SG'],
            website: null,
            profile_info: null,
            created_at: '2026-10-24T01:00:00Z',
          },
        ],
        error: null,
      },
      public_profiles: { data: [{ id: 'u1', display_name: 'Aiko' }], error: null },
    });

    const queue = await listReviewQueue(client);

    expect(queue.teas).toEqual([
      expect.objectContaining({ id: 't1', name: 'Hoshi', addedByName: 'Aiko' }),
    ]);
    expect(queue.shops).toEqual([expect.objectContaining({ id: 'v1', shipsTo: ['SG'] })]);
    expect(calls.filter((c) => c.method === 'eq').map((c) => c.args)).toEqual([
      ['status', 'pending'],
      ['status', 'pending'],
    ]);
  });

  it('throws when either list fails', async () => {
    const error = new Error('rls');
    const { client } = createFakeSupabase({
      products: { data: null, error },
      vendors: { data: [], error: null },
    });
    await expect(listReviewQueue(client)).rejects.toBe(error);
  });
});

describe('admin actions', () => {
  it('call the checked database functions with their arguments', async () => {
    const ok = { data: null, error: null };
    const { client, calls } = createFakeSupabase({
      'rpc:review_tea': ok,
      'rpc:merge_tea': ok,
      'rpc:review_vendor': ok,
      'rpc:set_tea_links': ok,
    });

    await reviewTea(client, 't1', 'rejected', 'Duplicate');
    await mergeTea(client, 't1', 't2');
    await reviewShop(client, 'v1', 'approved');
    await setTeaLinks(client, 't2', { image: '', shop: 'https://shop.example' });

    expect(calls.map((c) => [c.table, c.args[0]])).toEqual([
      ['rpc:review_tea', { tea: 't1', decision: 'rejected', note: 'Duplicate' }],
      ['rpc:merge_tea', { duplicate: 't1', keep: 't2' }],
      ['rpc:review_vendor', { vendor: 'v1', decision: 'approved', note: undefined }],
      ['rpc:set_tea_links', { tea: 't2', image: '', shop: 'https://shop.example' }],
    ]);
  });

  it('surface the database’s refusal', async () => {
    const error = Object.assign(new Error('Only admins can do that.'), { code: '42501' });
    const { client } = createFakeSupabase({ 'rpc:review_tea': { data: null, error } });
    await expect(reviewTea(client, 't1', 'approved')).rejects.toBe(error);
  });
});
