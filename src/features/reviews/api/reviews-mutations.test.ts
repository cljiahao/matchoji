import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import type { Database } from '@/integrations/supabase/database.types';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import { createReview, uploadReviewPhoto } from './reviews-mutations';

function storageClient(uploadError: unknown = null) {
  const upload = vi.fn().mockResolvedValue({ error: uploadError });
  const getPublicUrl = vi.fn((path: string) => ({
    data: { publicUrl: `https://cdn.test/${path}` },
  }));
  const from = vi.fn(() => ({ upload, getPublicUrl }));
  return {
    client: { storage: { from } } as unknown as SupabaseClient<Database>,
    from,
    upload,
  };
}

describe('uploadReviewPhoto', () => {
  // Storage RLS only lets a user write under their own uid folder.
  it('uploads under the user id folder and returns the public URL', async () => {
    const { client, from, upload } = storageClient();
    const file = new File(['x'], 'cup.jpg', { type: 'image/jpeg' });

    const photo = await uploadReviewPhoto(client, 'user-1', file);

    expect(from).toHaveBeenCalledWith('review-photos');
    const path = upload.mock.calls[0][0] as string;
    // A random name keeps the visitor's own file name out of the public URL.
    expect(path).toMatch(/^user-1\/[0-9a-f-]{36}\.jpg$/);
    expect(photo).toEqual({ path, publicUrl: `https://cdn.test/${path}` });
  });

  it('throws when the upload fails', async () => {
    const error = new Error('too large');
    const { client } = storageClient(error);
    await expect(uploadReviewPhoto(client, 'user-1', new File(['x'], 'cup.jpg'))).rejects.toBe(
      error
    );
  });
});

describe('createReview', () => {
  it('inserts the review with nulls for missing notes and photo', async () => {
    const { client, calls } = createFakeSupabase({ reviews: { data: null, error: null } });

    await createReview(client, { productId: 'p1', userId: 'u1', stars: 5 });

    expect(calls).toContainEqual({
      table: 'reviews',
      method: 'insert',
      args: [
        expect.objectContaining({
          product_id: 'p1',
          user_id: 'u1',
          stars: 5,
          notes: null,
          photo_url: null,
          flavor_notes: [],
          prep_method: null,
          // The taster's local date, never the database's UTC default.
          tasted_on: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      ],
    });
  });

  it('inserts profile, notes and prep columns', async () => {
    const { client, calls } = createFakeSupabase({ reviews: { data: null, error: null } });

    await createReview(client, {
      productId: 'p1',
      userId: 'u1',
      stars: 4,
      flavorNotes: ['umami', 'creamy'],
      umami: 5,
      body: 3,
      prepMethod: 'usucha',
      doseG: 2,
      waterMl: 70,
      waterTempC: 80,
      harvestYear: 2025,
      flush: 'first',
      tastedOn: '2026-10-01',
    });

    expect(calls.find((c) => c.method === 'insert')?.args[0]).toEqual({
      product_id: 'p1',
      user_id: 'u1',
      stars: 4,
      notes: null,
      photo_url: null,
      flavor_notes: ['umami', 'creamy'],
      sweetness: null,
      umami: 5,
      bitterness: null,
      body: 3,
      prep_method: 'usucha',
      dose_g: 2,
      water_ml: 70,
      water_temp_c: 80,
      harvest_year: 2025,
      flush: 'first',
      tasted_on: '2026-10-01',
    });
  });

  it('throws the Supabase error', async () => {
    const error = new Error('rls');
    const { client } = createFakeSupabase({ reviews: { data: null, error } });
    await expect(createReview(client, { productId: 'p1', userId: 'u1', stars: 5 })).rejects.toBe(
      error
    );
  });
});
