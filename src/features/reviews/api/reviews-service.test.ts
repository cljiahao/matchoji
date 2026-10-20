import { describe, expect, it } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { listReviews } from './reviews-service';

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
      reviews: { data: [review('r1', 'u1'), review('r2', 'u2')], error: null },
      public_profiles: { data: [{ id: 'u1', display_name: 'Aiko' }], error: null },
    });

    const reviews = await listReviews(client, 'p1');

    expect(reviews.map((r) => r.reviewerName)).toEqual(['Aiko', 'Anonymous']);
    expect(reviews[0]).toMatchObject({ id: 'r1', productId: 'p1', stars: 4, notes: 'nutty' });
    expect(calls.some((c) => c.table === 'profiles')).toBe(false);
  });

  // numeric(4,1) can arrive as a string; unset attributes stay out of the profile.
  it('maps profile and prep, omitting unset attributes', async () => {
    const { client } = createFakeSupabase({
      reviews: { data: [review('r1', 'u1')], error: null },
      public_profiles: { data: [], error: null },
    });

    const [r] = await listReviews(client, 'p1');

    expect(r.flavorNotes).toEqual(['nutty']);
    expect(r.profile).toEqual({ umami: 4, body: 3 });
    expect(r.prep).toEqual({ method: 'latte', doseG: 2.5, waterMl: null, waterTempC: 75 });
    expect(r.tastedOn).toBe('2026-09-01');
  });

  it('skips the profile lookup when there are no reviews', async () => {
    const { client, calls } = createFakeSupabase({ reviews: { data: [], error: null } });

    expect(await listReviews(client, 'p1')).toEqual([]);
    expect(calls.some((c) => c.table === 'public_profiles')).toBe(false);
  });

  it('throws the Supabase error', async () => {
    const error = new Error('boom');
    const { client } = createFakeSupabase({ reviews: { data: null, error } });
    await expect(listReviews(client, 'p1')).rejects.toBe(error);
  });
});
