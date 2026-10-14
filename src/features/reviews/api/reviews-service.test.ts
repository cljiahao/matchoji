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
