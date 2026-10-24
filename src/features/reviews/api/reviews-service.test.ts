import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { listEditions, listReviews } from './reviews-service';

const review = (id: string, userId: string) => ({
  id,
  product_id: 'p1',
  user_id: userId,
  stars: 4,
  notes: 'nutty',
  photo_url: null,
  created_at: '2026-09-01T00:00:00Z',
  flavor_notes: ['nutty'],
  sweetness: null,
  umami: 4,
  bitterness: null,
  body: '3',
  prep_method: 'latte',
  dose_g: '2.5',
  water_ml: null,
  water_temp_c: 75,
  tasted_on: '2026-09-01',
});

describe('listReviews', () => {
  it('maps reviews and names reviewers from public_profiles, never profiles', async () => {
    const { client, calls } = createFakeSupabase({
      latest_reviews: {
        data: [review('r1', 'u1'), review('r2', 'u2'), { ...review('r3', 'u3'), user_id: null }],
        error: null,
      },
      public_profiles: { data: [{ id: 'u1', display_name: 'Aiko' }], error: null },
    });

    const reviews = await listReviews(client, 'p1');

    // A deleted account's rating stays, unnamed; only real authors are looked up.
    expect(reviews.map((r) => r.reviewerName)).toEqual(['Aiko', 'Former taster', 'Former taster']);
    expect(calls).toContainEqual({
      table: 'public_profiles',
      method: 'in',
      args: ['id', ['u1', 'u2']],
    });
    expect(reviews[0]).toMatchObject({ id: 'r1', productId: 'p1', stars: 4, notes: 'nutty' });
    expect(calls.some((c) => c.table === 'profiles')).toBe(false);
  });

  // numeric(4,1) can arrive as a string; unset attributes stay out of the profile.
  it('maps profile and prep, omitting unset attributes', async () => {
    const { client } = createFakeSupabase({
      latest_reviews: { data: [review('r1', 'u1')], error: null },
      public_profiles: { data: [], error: null },
    });

    const [r] = await listReviews(client, 'p1');

    expect(r.flavorNotes).toEqual(['nutty']);
    expect(r.profile).toEqual({ umami: 4, body: 3 });
    expect(r.prep).toEqual({ method: 'latte', doseG: 2.5, waterMl: null, waterTempC: 75 });
    expect(r.tastedOn).toBe('2026-09-01');
  });

  it('skips the profile lookup when there are no reviews', async () => {
    const { client, calls } = createFakeSupabase({ latest_reviews: { data: [], error: null } });

    expect(await listReviews(client, 'p1')).toEqual([]);
    expect(calls.some((c) => c.table === 'public_profiles')).toBe(false);
  });

  it('throws the Supabase error', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ latest_reviews: { data: null, error } });
    await expect(listReviews(client, 'p1')).rejects.toBe(error);
  });

  it('throws when reviewer names fail to load instead of showing "Anonymous"', async () => {
    const error = new Error('names');
    const { client } = createFakeSupabase({
      latest_reviews: { data: [review('r1', 'u1')], error: null },
      public_profiles: { data: null, error },
    });
    await expect(listReviews(client, 'p1')).rejects.toBe(error);
  });
});

describe('listEditions', () => {
  it('reads a tea’s harvests newest first, coercing numbers', async () => {
    const { client, calls } = createFakeSupabase({
      edition_ratings: {
        data: [
          {
            harvest_year: 2025,
            flush: 'first',
            review_count: '3',
            avg_stars: '4.67',
            top_harvest: true,
          },
        ],
        error: null,
      },
    });
    expect(await listEditions(client, 'p1')).toEqual([
      { harvestYear: 2025, flush: 'first', reviewCount: 3, avgStars: 4.67, topHarvest: true },
    ]);
    expect(calls).toContainEqual({
      table: 'edition_ratings',
      method: 'order',
      args: ['harvest_year', { ascending: false }],
    });
  });

  it('throws the Supabase error', async () => {
    const error = new Error('down');
    const { client } = createFakeSupabase({ edition_ratings: { data: null, error } });
    await expect(listEditions(client, 'p1')).rejects.toBe(error);
  });
});
