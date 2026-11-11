import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  getProfileView,
  listBlocked,
  listTasters,
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
          is_trusted_taster: false,
          instagram_handle: null,
          bio: null,
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
          is_trusted_taster: false,
          instagram_handle: null,
          bio: null,
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
    expect(
      feed.map((t) => [t.reviewerName, t.authorId, 'product' in t ? t.product.name : null])
    ).toEqual([
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

describe('feed with drink reviews', () => {
  it('renders a drink review with café name', async () => {
    const { client } = createFakeSupabase({
      'rpc:following_feed': {
        data: [
          { ...review('r1', 'u2'), product_id: null, drink_id: 'd1', disclosure: 'paid' },
          review('r2', 'u2'),
        ],
        error: null,
      },
      public_profiles: { data: [{ id: 'u2', display_name: 'Cho' }], error: null },
      products: {
        data: [{ id: 'p1', name: 'Sayaka', brand: null, category: 'matcha' }],
        error: null,
      },
      drinks: {
        data: [
          { id: 'd1', cafe_id: 'c1', slug: 'matcha-latte', name: 'Matcha Latte', base: 'matcha' },
        ],
        error: null,
      },
      cafes: { data: [{ id: 'c1', slug: 'cafe-x', name: 'Café X' }], error: null },
    });
    const feed = await loadFeed(client, 5);
    expect(feed[0]).toMatchObject({
      reviewerName: 'Cho',
      disclosure: 'paid',
      drink: { name: 'Matcha Latte', cafe: { name: 'Café X', slug: 'cafe-x' } },
    });
    expect(feed[1]).toMatchObject({ product: { name: 'Sayaka' } });
  });

  it('counts only teas on a profile', async () => {
    const { client, calls } = createFakeSupabase({
      public_profiles: {
        data: {
          id: 'u1',
          display_name: 'Ben',
          is_public: false,
          created_at: '2026-09-01T00:00:00Z',
          is_trusted_taster: false,
          instagram_handle: null,
          bio: null,
        },
        error: null,
      },
      latest_reviews: { data: null, count: 2, error: null },
      follows: { data: null, count: 0, error: null },
    });
    await getProfileView(client, 'u1', null);
    expect(calls).toContainEqual({
      table: 'latest_reviews',
      method: 'not',
      args: ['product_id', 'is', null],
    });
  });
});

describe('getProfileView taster fields', () => {
  const person = {
    id: 'u1',
    display_name: 'Foodcnl',
    is_public: true,
    created_at: '2026-09-01T00:00:00Z',
    is_trusted_taster: true,
    instagram_handle: 'foodcnl',
    bio: 'Hojicha first.',
  };
  const drinkReview = { ...review('r1', 'u1'), product_id: null, drink_id: 'd1' };

  it('returns the badge, handle, bio and the drink reviews apart from tea tastings', async () => {
    const { client } = createFakeSupabase({
      public_profiles: { data: person, error: null },
      latest_reviews: [
        { data: null, count: 1, error: null },
        { data: [drinkReview, review('r2', 'u1')], error: null },
      ],
      follows: { data: null, count: 0, error: null },
      products: {
        data: [{ id: 'p1', name: 'Sayaka', brand: null, category: 'matcha' }],
        error: null,
      },
      drinks: {
        data: [
          {
            id: 'd1',
            cafe_id: 'c1',
            slug: 'hojicha-latte',
            name: 'Hojicha latte',
            base: 'hojicha',
          },
        ],
        error: null,
      },
      cafes: { data: [{ id: 'c1', slug: 'kurasu', name: 'Kurasu' }], error: null },
    });
    const view = await getProfileView(client, 'u1', null);
    expect(view?.profile).toMatchObject({
      isTrustedTaster: true,
      instagramHandle: 'foodcnl',
      bio: 'Hojicha first.',
    });
    expect(view?.drinkReviews.map((t) => t.drink.name)).toEqual(['Hojicha latte']);
    expect(view?.recent).toHaveLength(2);
  });
});

describe('listTasters', () => {
  const people = [
    { id: 'u1', display_name: 'Foodcnl', instagram_handle: 'foodcnl', bio: 'Hojicha first.' },
    { id: 'u2', display_name: 'Newbie', instagram_handle: null, bio: null },
  ];
  const drinkReview = (id: string, userId: string, drinkId: string, createdAt: string) => ({
    ...review(id, userId),
    product_id: null,
    drink_id: drinkId,
    created_at: createdAt,
  });

  const stat = (userId: string, count: number, latest: string) => ({
    user_id: userId,
    drink_review_count: count,
    latest_review_id: latest,
  });
  const drinks = {
    data: [
      { id: 'd1', cafe_id: 'c1', slug: 'a', name: 'Matcha latte', base: 'matcha' },
      { id: 'd2', cafe_id: 'c1', slug: 'b', name: 'Hojicha float', base: 'hojicha' },
    ],
    error: null,
  };
  const cafes = { data: [{ id: 'c1', slug: 'kurasu', name: 'Kurasu' }], error: null };

  it('reads trusted, public profiles only and returns each with a count and latest drink', async () => {
    const { client, calls } = createFakeSupabase({
      public_profiles: { data: people, error: null },
      taster_stats: { data: [stat('u1', 2, 'r2')], error: null },
      latest_reviews: {
        data: [drinkReview('r2', 'u1', 'd2', '2026-11-05T00:00:00Z')],
        error: null,
      },
      drinks,
      cafes,
    });
    const tasters = await listTasters(client);

    const eqs = calls.filter((c) => c.table === 'public_profiles' && c.method === 'eq');
    expect(eqs.map((c) => c.args)).toEqual([
      ['is_trusted_taster', true],
      ['is_public', true],
    ]);
    expect(tasters.map((t) => [t.name, t.drinkReviewCount, t.latest?.drink.name ?? null])).toEqual([
      ['Foodcnl', 2, 'Hojicha float'],
      ['Newbie', 0, null],
    ]);
    expect(tasters[0]).toMatchObject({ bio: 'Hojicha first.', instagramHandle: 'foodcnl' });
    // The roster is bounded; counts come from the view, not from a capped read of reviews.
    const limits = calls.filter((c) => c.method === 'limit').map((c) => [c.table, c.args[0]]);
    expect(limits).toEqual([['public_profiles', 100]]);
    expect(calls.some((c) => c.table === 'reviews')).toBe(false);
  });

  it('gives an older taster their full count and latest review beside a busier one', async () => {
    const { client } = createFakeSupabase({
      public_profiles: { data: people, error: null },
      taster_stats: {
        data: [stat('u1', 900, 'r9'), stat('u2', 3, 'r1')],
        error: null,
      },
      latest_reviews: {
        data: [
          drinkReview('r9', 'u1', 'd2', '2026-11-09T00:00:00Z'),
          drinkReview('r1', 'u2', 'd1', '2026-01-01T00:00:00Z'),
        ],
        error: null,
      },
      drinks,
      cafes,
    });
    const tasters = await listTasters(client);
    expect(tasters.map((t) => [t.name, t.drinkReviewCount, t.latest?.drink.name])).toEqual([
      ['Foodcnl', 900, 'Hojicha float'],
      ['Newbie', 3, 'Matcha latte'],
    ]);
  });

  it('keeps the count when the newest review is no longer visible', async () => {
    const { client } = createFakeSupabase({
      public_profiles: { data: people, error: null },
      taster_stats: { data: [stat('u1', 2, 'r3')], error: null },
      latest_reviews: { data: [], error: null },
      drinks: { data: [], error: null },
    });
    const [first] = await listTasters(client);
    expect(first).toMatchObject({ drinkReviewCount: 2, latest: null });
  });

  it('is empty, without reading reviews, when nobody is a trusted taster', async () => {
    const { client, calls } = createFakeSupabase({ public_profiles: { data: [], error: null } });
    expect(await listTasters(client)).toEqual([]);
    expect(calls.some((c) => c.table === 'latest_reviews')).toBe(false);
  });

  it('throws when a read fails', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase({ public_profiles: { data: null, error } });
    await expect(listTasters(client)).rejects.toBe(error);
  });
});
