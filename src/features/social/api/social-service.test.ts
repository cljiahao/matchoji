import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  getProfileView,
  listBlocked,
  loadFeed,
  setBlocked,
  setFollowing,
  setProfilePublic,
} from './social-service';

const review = (id: string, userId: string | null, productId = 'p1') => ({
  id,
  product_id: productId,
  user_id: userId,
  stars: 5,
  notes: null,
  photo_url: null,
  created_at: '2026-10-05T00:00:00Z',
  flavor_notes: [],
  sweetness: null,
  umami: null,
  bitterness: null,
  body: null,
  prep_method: null,
  dose_g: null,
  water_ml: null,
  water_temp_c: null,
  tasted_on: '2026-10-05',
});

describe('getProfileView', () => {
  it('is null for an unknown taster', async () => {
    const { client } = createFakeSupabase({ public_profiles: { data: null, error: null } });
    expect(await getProfileView(client, 'u1', null)).toBeNull();
  });

  it('skips the viewer reads and recent tastings for a private profile seen by a visitor', async () => {
    const { client, calls } = createFakeSupabase({
      public_profiles: {
        data: {
          id: 'u1',
          display_name: 'Ben',
          is_public: false,
          created_at: '2026-09-01T00:00:00Z',
        },
        error: null,
      },
      latest_reviews: { data: null, count: 3, error: null },
      follows: { data: null, count: 1, error: null },
    });
    const view = await getProfileView(client, 'u1', null);
    expect(view).toMatchObject({
      viewer: { isSelf: false, follows: false, blocked: false },
      recent: [],
    });
    expect(calls.some((c) => c.table === 'blocks')).toBe(false);
  });

  it('throws when a read fails', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase({
      public_profiles: {
        data: {
          id: 'u1',
          display_name: 'Ben',
          is_public: true,
          created_at: '2026-09-01T00:00:00Z',
        },
        error: null,
      },
      latest_reviews: { data: null, error },
      follows: { data: null, count: 0, error: null },
    });
    await expect(getProfileView(client, 'u1', 'u1')).rejects.toBe(error);
  });
});

describe('loadFeed', () => {
  it('names each author and pairs the tasting with its tea', async () => {
    const { client, calls } = createFakeSupabase({
      'rpc:following_feed': { data: [review('r1', 'u2'), review('r2', null)], error: null },
      public_profiles: { data: [{ id: 'u2', display_name: 'Cho' }], error: null },
      products: {
        data: [{ id: 'p1', name: 'Sayaka', brand: null, category: 'matcha' }],
        error: null,
      },
    });
    const feed = await loadFeed(client, 5);
    expect(feed.map((t) => [t.reviewerName, t.authorId, t.product.name])).toEqual([
      ['Cho', 'u2', 'Sayaka'],
      ['Former taster', null, 'Sayaka'],
    ]);
    expect(calls[0]).toEqual({
      table: 'rpc:following_feed',
      method: 'rpc',
      args: [{ max_rows: 5 }],
    });
  });

  it('is empty without a query for names when nobody followed has tasted anything', async () => {
    const { client, calls } = createFakeSupabase({
      'rpc:following_feed': { data: [], error: null },
    });
    expect(await loadFeed(client)).toEqual([]);
    expect(calls).toHaveLength(1);
  });
});

describe('follow, block and privacy writes', () => {
  it('insert or delete the caller’s own rows', async () => {
    const ok = { data: null, error: null };
    const { client, calls } = createFakeSupabase({ follows: ok, blocks: ok, profiles: ok });
    await setFollowing(client, 'me', 'them', true);
    await setFollowing(client, 'me', 'them', false);
    await setBlocked(client, 'me', 'them', true);
    await setBlocked(client, 'me', 'them', false);
    await setProfilePublic(client, 'me', false);

    expect(calls.filter((c) => ['insert', 'delete', 'update'].includes(c.method))).toEqual([
      { table: 'follows', method: 'insert', args: [{ follower_id: 'me', followee_id: 'them' }] },
      { table: 'follows', method: 'delete', args: [] },
      { table: 'blocks', method: 'insert', args: [{ blocker_id: 'me', blocked_id: 'them' }] },
      { table: 'blocks', method: 'delete', args: [] },
      { table: 'profiles', method: 'update', args: [{ is_public: false }] },
    ]);
  });

  it('surface a refusal', async () => {
    const error = new Error('row-level security');
    const { client } = createFakeSupabase({ follows: { data: null, error } });
    await expect(setFollowing(client, 'me', 'them', true)).rejects.toBe(error);
  });

  it('list who the caller blocked, by name', async () => {
    const { client } = createFakeSupabase({
      blocks: { data: [{ blocked_id: 'u9' }], error: null },
      public_profiles: { data: [{ id: 'u9', display_name: 'Spammy' }], error: null },
    });
    expect(await listBlocked(client, 'me')).toEqual([{ id: 'u9', name: 'Spammy' }]);
  });
});
