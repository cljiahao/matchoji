import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  getCafePage,
  getDrinkPage,
  listCafes,
  listCafeSitemapEntries,
  listCities,
  listLatestTasterDrinkReviews,
  listSimilarDrinks,
  listTopDrinks,
} from './cafes-service';

const ok = (data: unknown) => ({ data, error: null });

const cafeRow = (over: Record<string, unknown> = {}) => ({
  id: 'c1',
  slug: 'kurasu-bugis',
  name: 'Kurasu',
  city_slug: 'singapore',
  area: 'Bugis',
  address: '1 Bugis St',
  lat: 1.3,
  lng: 103.85,
  instagram_handle: 'kurasu',
  website_url: null,
  status: 'approved',
  merged_into: null,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  ...over,
});

const drinkRow = (over: Record<string, unknown> = {}) => ({
  id: 'd1',
  cafe_id: 'c1',
  slug: 'hojicha-latte',
  name: 'Hojicha Latte',
  base: 'hojicha',
  style: 'latte',
  serving: 'both',
  price: 7.5,
  currency: 'SGD',
  photo_url: null,
  photo_credit: null,
  tea_product_id: null,
  status: 'approved',
  merged_into: null,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  ...over,
});

const ratingRow = (drink_id: string, over: Record<string, unknown> = {}) => ({
  drink_id,
  taster_count: 0,
  taster_avg: null,
  taster_disclosed_count: 0,
  community_count: 0,
  community_avg: null,
  ...over,
});

const cafeRating = (cafe_id: string, over: Record<string, unknown> = {}) => ({
  cafe_id,
  drink_count: 1,
  taster_count: 0,
  taster_avg: null,
  community_count: 0,
  community_avg: null,
  ...over,
});

const reviewRow = (over: Record<string, unknown> = {}) => ({
  id: 'r1',
  product_id: null,
  drink_id: 'd1',
  user_id: 'u1',
  author_private: false,
  stars: 4,
  notes: 'Roasty',
  photo_url: null,
  created_at: '2026-11-05T00:00:00Z',
  flavor_notes: [],
  sweetness: null,
  umami: null,
  bitterness: null,
  body: null,
  prep_method: null,
  dose_g: null,
  water_ml: null,
  water_temp_c: null,
  tasted_on: '2026-11-05',
  harvest_year: null,
  flush: null,
  instagram_url: null,
  disclosure: 'none',
  tea_strength: null,
  roast: null,
  by_trusted_taster: false,
  ...over,
});

const drinkNode = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  slug: `drink-${id}`,
  cafe_id: 'c1',
  status: 'approved',
  merged_into: null,
  ...over,
});

const missing = { data: null, error: { code: '42P01', message: 'no table' } };

const eqCalls = (calls: { table: string; method: string; args: unknown[] }[], table: string) =>
  calls.filter((c) => c.table === table && c.method === 'eq').map((c) => c.args);

describe('listCities', () => {
  it('lists the two seeded cities with their currency', async () => {
    const cities = await listCities();
    expect(cities.map((c) => [c.slug, c.currency])).toEqual([
      ['singapore', 'SGD'],
      ['johor-bahru', 'MYR'],
    ]);
  });
});

describe('listCafes', () => {
  it('filters by city and area', async () => {
    const { client, calls } = createFakeSupabase({
      cafes: ok([cafeRow()]),
      cafe_ratings: ok([cafeRating('c1', { taster_count: 1, taster_avg: '4.50' })]),
    });
    const cafes = await listCafes(client, { city: 'singapore', area: 'Bugis' });
    expect(cafes).toHaveLength(1);
    expect(cafes[0]).toMatchObject({ slug: 'kurasu-bugis', drinkCount: 1 });
    expect(cafes[0].scores.tasterAvg).toBe(4.5);
    expect(eqCalls(calls, 'cafes')).toEqual(
      expect.arrayContaining([
        ['city_slug', 'singapore'],
        ['area', 'Bugis'],
        ['status', 'approved'],
      ])
    );
  });

  it('keeps only cafés with a taster review when asked', async () => {
    const { client } = createFakeSupabase({
      cafes: ok([cafeRow(), cafeRow({ id: 'c2', slug: 'other' })]),
      cafe_ratings: ok([cafeRating('c1', { taster_count: 1, taster_avg: 4 }), cafeRating('c2')]),
    });
    const cafes = await listCafes(client, { city: 'singapore', tasterOnly: true });
    expect(cafes.map((c) => c.id)).toEqual(['c1']);
  });

  it('returns [] on 42P01', async () => {
    const { client } = createFakeSupabase({ cafes: missing });
    expect(await listCafes(client, { city: 'singapore' })).toEqual([]);
  });

  it('throws other errors', async () => {
    const { client } = createFakeSupabase({
      cafes: { data: null, error: new Error('boom') },
    });
    await expect(listCafes(client, { city: 'singapore' })).rejects.toThrow('boom');
  });
});

describe('getCafePage', () => {
  it('redirects merged café', async () => {
    const { client } = createFakeSupabase({
      cafes: [ok(cafeRow({ merged_into: 'c9' })), ok(cafeRow({ id: 'c9', slug: 'kurasu-new' }))],
    });
    expect(await getCafePage(client, 'kurasu-bugis')).toEqual({
      kind: 'redirect',
      to: '/cafes/kurasu-new',
    });
  });

  it('is missing for an unknown, rejected or unreadable café', async () => {
    for (const result of [ok(null), ok(cafeRow({ status: 'rejected' })), missing]) {
      const { client } = createFakeSupabase({ cafes: result });
      expect(await getCafePage(client, 'x')).toEqual({ kind: 'missing' });
    }
  });

  it('is missing when the survivor of a merge cannot be read', async () => {
    const { client } = createFakeSupabase({
      cafes: [ok(cafeRow({ merged_into: 'c9' })), ok(null)],
    });
    expect(await getCafePage(client, 'kurasu-bugis')).toEqual({ kind: 'missing' });
  });

  it('follows a chain of merges to the final café in one redirect', async () => {
    const { client } = createFakeSupabase({
      cafes: [
        ok(cafeRow({ id: 'a', slug: 'cafe-a', merged_into: 'b' })),
        ok(cafeRow({ id: 'b', slug: 'cafe-b', merged_into: 'c' })),
        ok(cafeRow({ id: 'c', slug: 'cafe-c' })),
      ],
    });
    expect(await getCafePage(client, 'cafe-a')).toEqual({ kind: 'redirect', to: '/cafes/cafe-c' });
  });

  it('is missing when merges loop back on themselves', async () => {
    const { client } = createFakeSupabase({
      cafes: [
        ok(cafeRow({ id: 'a', slug: 'cafe-a', merged_into: 'b' })),
        ok(cafeRow({ id: 'b', slug: 'cafe-b', merged_into: 'a' })),
      ],
    });
    expect(await getCafePage(client, 'cafe-a')).toEqual({ kind: 'missing' });
  });

  it('is missing when a merge chain is longer than the hop cap', async () => {
    const link = (n: number) =>
      ok(cafeRow({ id: `n${n}`, slug: `cafe-${n}`, merged_into: `n${n + 1}` }));
    const { client } = createFakeSupabase({
      cafes: [0, 1, 2, 3, 4, 5, 6].map(link),
    });
    expect(await getCafePage(client, 'cafe-0')).toEqual({ kind: 'missing' });
  });

  it('is missing when the final survivor of a merge was rejected', async () => {
    const { client } = createFakeSupabase({
      cafes: [
        ok(cafeRow({ id: 'a', merged_into: 'b' })),
        ok(cafeRow({ id: 'b', status: 'rejected' })),
      ],
    });
    expect(await getCafePage(client, 'kurasu-bugis')).toEqual({ kind: 'missing' });
  });

  it('lists the café drinks with their scores', async () => {
    const { client } = createFakeSupabase({
      cafes: ok(cafeRow()),
      drinks: ok([drinkRow()]),
      drink_ratings: ok([ratingRow('d1', { taster_count: 2, taster_avg: '4.00' })]),
      cafe_ratings: ok(cafeRating('c1', { taster_count: 2, taster_avg: '4.20' })),
    });
    const page = await getCafePage(client, 'kurasu-bugis');
    if (page.kind !== 'found') throw new Error('expected found');
    expect(page.scores.tasterAvg).toBeCloseTo(4.2);
    expect(page.cafe.name).toBe('Kurasu');
    expect(page.drinks[0].scores.tasterCount).toBe(2);
    expect(page.drinks[0].cafe).toMatchObject({ slug: 'kurasu-bugis', name: 'Kurasu' });
  });

  it('shows a café with no drinks without querying ratings', async () => {
    const { client, calls } = createFakeSupabase({
      cafes: ok(cafeRow()),
      drinks: ok([]),
      cafe_ratings: ok(null),
    });
    const page = await getCafePage(client, 'kurasu-bugis');
    expect(page).toMatchObject({ kind: 'found', drinks: [] });
    expect(calls.some((c) => c.table === 'drink_ratings')).toBe(false);
  });
});

describe('getDrinkPage', () => {
  it('redirects rejected drink to café', async () => {
    const { client } = createFakeSupabase({
      cafes: ok(cafeRow()),
      drinks: ok(drinkRow({ status: 'rejected' })),
    });
    expect(await getDrinkPage(client, 'kurasu-bugis', 'hojicha-latte')).toEqual({
      kind: 'redirect',
      to: '/cafes/kurasu-bugis',
    });
  });

  it('redirects a merged drink to the survivor page', async () => {
    const { client } = createFakeSupabase({
      cafes: [ok(cafeRow()), ok({ slug: 'other-cafe' })],
      drinks: [
        ok(drinkRow({ merged_into: 'd9' })),
        ok(drinkNode('d9', { cafe_id: 'c2', slug: 'hojicha-latte-2' })),
      ],
    });
    expect(await getDrinkPage(client, 'kurasu-bugis', 'hojicha-latte')).toEqual({
      kind: 'redirect',
      to: '/cafes/other-cafe/hojicha-latte-2',
    });
  });

  it('redirects to the surviving café when a merge moved the drink', async () => {
    const { client } = createFakeSupabase({
      cafes: [ok(cafeRow({ merged_into: 'c9' })), ok(cafeRow({ id: 'c9', slug: 'kurasu-new' }))],
      drinks: ok(null),
    });
    expect(await getDrinkPage(client, 'kurasu-bugis', 'hojicha-latte')).toEqual({
      kind: 'redirect',
      to: '/cafes/kurasu-new/hojicha-latte',
    });
  });

  it('follows a merged café chain reached through a drink slug', async () => {
    const { client } = createFakeSupabase({
      cafes: [
        ok(cafeRow({ id: 'a', slug: 'cafe-a', merged_into: 'b' })),
        ok(cafeRow({ id: 'b', slug: 'cafe-b', merged_into: 'c' })),
        ok(cafeRow({ id: 'c', slug: 'cafe-c' })),
      ],
      drinks: ok(null),
    });
    expect(await getDrinkPage(client, 'cafe-a', 'hojicha-latte')).toEqual({
      kind: 'redirect',
      to: '/cafes/cafe-c/hojicha-latte',
    });
  });

  it('is missing when a merged café chain loops', async () => {
    const { client } = createFakeSupabase({
      cafes: [
        ok(cafeRow({ id: 'a', merged_into: 'b' })),
        ok(cafeRow({ id: 'b', merged_into: 'a' })),
      ],
      drinks: ok(null),
    });
    expect(await getDrinkPage(client, 'kurasu-bugis', 'hojicha-latte')).toEqual({
      kind: 'missing',
    });
  });

  it('follows a chain of drink merges to the final drink in one redirect', async () => {
    const { client } = createFakeSupabase({
      cafes: ok(cafeRow()),
      drinks: [
        ok(drinkRow({ id: 'd1', merged_into: 'd2' })),
        ok(drinkNode('d2', { slug: 'drink-2', merged_into: 'd3' })),
        ok(drinkNode('d3', { slug: 'drink-3' })),
      ],
    });
    expect(await getDrinkPage(client, 'kurasu-bugis', 'hojicha-latte')).toEqual({
      kind: 'redirect',
      to: '/cafes/kurasu-bugis/drink-3',
    });
  });

  it('is missing when drink merges loop, and falls back to the café when the survivor is gone or rejected', async () => {
    const looping = createFakeSupabase({
      cafes: ok(cafeRow()),
      drinks: [
        ok(drinkRow({ id: 'd1', merged_into: 'd2' })),
        ok(drinkNode('d2', { merged_into: 'd1' })),
      ],
    });
    expect(await getDrinkPage(looping.client, 'kurasu-bugis', 'hojicha-latte')).toEqual({
      kind: 'missing',
    });

    for (const survivor of [ok(null), ok(drinkNode('d2', { status: 'rejected' }))]) {
      const { client } = createFakeSupabase({
        cafes: ok(cafeRow()),
        drinks: [ok(drinkRow({ merged_into: 'd2' })), survivor],
      });
      expect(await getDrinkPage(client, 'kurasu-bugis', 'hojicha-latte')).toEqual({
        kind: 'redirect',
        to: '/cafes/kurasu-bugis',
      });
    }
  });

  it('shows the drink without reviews or names when their database objects are missing', async () => {
    const noFunction = { data: null, error: { code: 'PGRST202', message: 'no function' } };
    const { client } = createFakeSupabase({
      cafes: ok(cafeRow()),
      drinks: ok(drinkRow()),
      drink_ratings: missing,
      'rpc:drink_reviews': noFunction,
    });
    const page = await getDrinkPage(client, 'kurasu-bugis', 'hojicha-latte');
    expect(page).toMatchObject({ kind: 'found', tasterReviews: [], communityReviews: [] });

    const names = createFakeSupabase({
      cafes: ok(cafeRow()),
      drinks: ok(drinkRow()),
      drink_ratings: ok(null),
      'rpc:drink_reviews': ok([reviewRow({ user_id: 'u1' })]),
      public_profiles: missing,
    });
    const named = await getDrinkPage(names.client, 'kurasu-bugis', 'hojicha-latte');
    if (named.kind !== 'found') throw new Error('expected found');
    expect(named.communityReviews[0].reviewerName).toBe('Former taster');
  });

  it('is missing for an unknown café, drink or rejected café', async () => {
    const cases = [
      { cafes: ok(null), drinks: ok(null) },
      { cafes: ok(cafeRow()), drinks: ok(null) },
      { cafes: ok(cafeRow({ status: 'rejected' })), drinks: ok(drinkRow()) },
    ];
    for (const queued of cases) {
      const { client } = createFakeSupabase(queued);
      expect(await getDrinkPage(client, 'a', 'b')).toEqual({ kind: 'missing' });
    }
  });

  it('splits taster and community reviews', async () => {
    const { client } = createFakeSupabase({
      cafes: ok(cafeRow()),
      drinks: ok(drinkRow({ tea_product_id: 'p1' })),
      drink_ratings: ok(ratingRow('d1', { taster_count: 1, taster_avg: 5, community_count: 1 })),
      'rpc:drink_reviews': ok([
        reviewRow({ id: 'r1', by_trusted_taster: true, user_id: 'u1' }),
        reviewRow({ id: 'r2', user_id: 'u2' }),
        reviewRow({ id: 'r3', user_id: null }),
      ]),
      public_profiles: ok([
        { id: 'u1', display_name: 'Mei' },
        { id: 'u2', display_name: 'Ken' },
      ]),
      products: ok({ id: 'p1', name: 'Hojicha Powder' }),
    });
    const page = await getDrinkPage(client, 'kurasu-bugis', 'hojicha-latte');
    if (page.kind !== 'found') throw new Error('expected found');
    expect(page.tasterReviews.map((r) => r.reviewerName)).toEqual(['Mei']);
    expect(page.communityReviews.map((r) => r.reviewerName)).toEqual(['Ken', 'Former taster']);
    expect(page.teaProduct).toEqual({ id: 'p1', name: 'Hojicha Powder' });
    expect(page.drink.scores.tasterAvg).toBe(5);
  });

  it('names a private author as a private taster and skips the tea lookup when unset', async () => {
    const { client, calls } = createFakeSupabase({
      cafes: ok(cafeRow()),
      drinks: ok(drinkRow()),
      drink_ratings: ok(null),
      'rpc:drink_reviews': ok([reviewRow({ user_id: null, author_private: true })]),
    });
    const page = await getDrinkPage(client, 'kurasu-bugis', 'hojicha-latte');
    if (page.kind !== 'found') throw new Error('expected found');
    expect(page.communityReviews[0].reviewerName).toBe('Private taster');
    expect(page.teaProduct).toBeNull();
    expect(calls.some((c) => c.table === 'products')).toBe(false);
  });
});

describe('listTopDrinks', () => {
  const queue = (ratings: unknown[]) => ({
    cafes: ok([cafeRow()]),
    drinks: ok([
      drinkRow({ id: 'd1', name: 'A' }),
      drinkRow({ id: 'd2', name: 'B' }),
      drinkRow({ id: 'd3', name: 'C' }),
      drinkRow({ id: 'd4', name: 'D' }),
    ]),
    drink_ratings: ok(ratings),
  });

  it('applies threshold (1 taster or 3 community)', async () => {
    const { client } = createFakeSupabase(
      queue([
        ratingRow('d1', { taster_count: 1, taster_avg: 3 }),
        ratingRow('d2', { community_count: 2, community_avg: 5 }),
        ratingRow('d3', { community_count: 3, community_avg: 4 }),
        ratingRow('d4'),
      ])
    );
    const top = await listTopDrinks(client, { city: 'singapore' });
    expect(top.map((d) => d.id)).toEqual(['d1', 'd3']);
  });

  it('ranks taster score above community', async () => {
    const { client } = createFakeSupabase(
      queue([
        ratingRow('d1', { taster_count: 1, taster_avg: 3 }),
        ratingRow('d2', { community_count: 9, community_avg: 5 }),
        ratingRow('d3', { taster_count: 1, taster_avg: 4.5 }),
        ratingRow('d4', { community_count: 3, community_avg: 4 }),
      ])
    );
    const top = await listTopDrinks(client, { city: 'singapore', limit: 3 });
    expect(top.map((d) => d.id)).toEqual(['d3', 'd1', 'd2']);
  });

  it('filters by base and style in the query', async () => {
    const { client, calls } = createFakeSupabase(queue([]));
    await listTopDrinks(client, { city: 'singapore', base: 'matcha', style: 'iced_latte' });
    expect(eqCalls(calls, 'drinks')).toEqual(
      expect.arrayContaining([
        ['base', 'matcha'],
        ['style', 'iced_latte'],
      ])
    );
  });

  it('returns [] when the city has no cafés or tables are missing', async () => {
    const empty = createFakeSupabase({ cafes: ok([]) });
    expect(await listTopDrinks(empty.client, { city: 'singapore' })).toEqual([]);
    const gone = createFakeSupabase({ cafes: missing });
    expect(await listTopDrinks(gone.client, { city: 'singapore' })).toEqual([]);
    const noDrinks = createFakeSupabase({ cafes: ok([cafeRow()]), drinks: missing });
    expect(await listTopDrinks(noDrinks.client, { city: 'singapore' })).toEqual([]);
  });
});

describe('listSimilarDrinks', () => {
  it('lists other drinks of the same base and style in the city', async () => {
    const { client, calls } = createFakeSupabase({
      cafes: ok([cafeRow()]),
      drinks: ok([drinkRow({ id: 'd1' }), drinkRow({ id: 'd2', name: 'Other' })]),
      drink_ratings: ok([ratingRow('d2', { community_count: 1, community_avg: 4 })]),
    });
    const similar = await listSimilarDrinks(
      client,
      {
        id: 'd1',
        cafeId: 'c1',
        slug: 'hojicha-latte',
        name: 'Hojicha Latte',
        base: 'hojicha',
        style: 'latte',
        serving: 'both',
        price: 7.5,
        currency: 'SGD',
        photoUrl: null,
        photoCredit: null,
        teaProductId: null,
        status: 'approved',
      },
      'singapore'
    );
    expect(similar.map((d) => d.id)).toEqual(['d2']);
    expect(eqCalls(calls, 'drinks')).toEqual(
      expect.arrayContaining([
        ['base', 'hojicha'],
        ['style', 'latte'],
      ])
    );
  });
});

describe('listLatestTasterDrinkReviews', () => {
  it('pairs the newest taster reviews with their drinks, one per person and drink', async () => {
    const { client } = createFakeSupabase({
      cafes: ok([cafeRow()]),
      drinks: ok([drinkRow()]),
      drink_ratings: ok([ratingRow('d1', { taster_count: 1, taster_avg: 4 })]),
      reviews: ok([
        reviewRow({ id: 'new', by_trusted_taster: true, created_at: '2026-11-06T00:00:00Z' }),
        reviewRow({ id: 'old', by_trusted_taster: true, created_at: '2026-11-01T00:00:00Z' }),
        reviewRow({ id: 'gone', by_trusted_taster: true, drink_id: 'unlisted' }),
      ]),
      public_profiles: ok([{ id: 'u1', display_name: 'Mei' }]),
    });
    const latest = await listLatestTasterDrinkReviews(client, { city: 'singapore' });
    expect(latest.map((l) => l.review.id)).toEqual(['new']);
    expect(latest[0].drink.name).toBe('Hojicha Latte');
    expect(latest[0].review.reviewerName).toBe('Mei');
  });

  it('returns [] when the city has no drinks', async () => {
    const { client } = createFakeSupabase({ cafes: ok([]) });
    expect(await listLatestTasterDrinkReviews(client, { city: 'singapore' })).toEqual([]);
  });

  it('returns [] when reviews table is missing', async () => {
    const { client } = createFakeSupabase({
      cafes: ok([cafeRow()]),
      drinks: ok([drinkRow()]),
      drink_ratings: ok([]),
      reviews: missing,
    });
    expect(await listLatestTasterDrinkReviews(client, { city: 'singapore' })).toEqual([]);
  });
});

describe('listCafeSitemapEntries', () => {
  it('lists approved cafés and their drinks, skipping merged ones', async () => {
    const { client, calls } = createFakeSupabase({
      cafes: ok([cafeRow()]),
      drinks: ok([drinkRow()]),
    });
    const entries = await listCafeSitemapEntries(client);
    expect(entries.map((e) => e.path)).toEqual([
      '/cafes/kurasu-bugis',
      '/cafes/kurasu-bugis/hojicha-latte',
    ]);
    expect(calls.some((c) => c.method === 'is' && c.args[0] === 'merged_into')).toBe(true);
  });

  it('returns [] before the migration is applied', async () => {
    const { client } = createFakeSupabase({ cafes: missing, drinks: missing });
    expect(await listCafeSitemapEntries(client)).toEqual([]);
  });

  it('reads every page past the 1000-row PostgREST cap and keeps each drink under its café', async () => {
    const full = Array.from({ length: 1000 }, (_, i) =>
      cafeRow({ id: `c${i}`, slug: `cafe-${i}` })
    );
    const { client, calls } = createFakeSupabase({
      cafes: [ok(full), ok([cafeRow({ id: 'last', slug: 'cafe-last' })])],
      drinks: [ok([drinkRow({ cafe_id: 'last', slug: 'late-drink' })])],
    });
    const entries = await listCafeSitemapEntries(client);
    expect(entries).toHaveLength(1002);
    expect(entries.at(-1)?.path).toBe('/cafes/cafe-last/late-drink');
    const ranges = calls.filter((c) => c.table === 'cafes' && c.method === 'range');
    expect(ranges.map((c) => c.args)).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });
});
