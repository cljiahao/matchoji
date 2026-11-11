import { describe, expect, it, vi } from 'vitest';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  RowNotChangedError,
  deleteReview,
  removeReviewPhoto,
  reviewPhotoPath,
  updateReview,
} from './reviews-mutations';

const PHOTO = 'https://x.supabase.co/storage/v1/object/public/review-photos/u1/2b4c.jpg';

describe('reviewPhotoPath', () => {
  it('reads the storage path from a public URL, and nothing from other URLs', () => {
    expect(reviewPhotoPath(PHOTO)).toBe('u1/2b4c.jpg');
    expect(reviewPhotoPath('https://elsewhere.example/a.jpg')).toBeNull();
    expect(reviewPhotoPath(null)).toBeNull();
  });
});

describe('updateReview', () => {
  it('writes every tasting field, filling blanks as null', async () => {
    const { client, calls } = createFakeSupabase({
      reviews: { data: [{ id: 'r1' }], error: null },
    });
    await updateReview(client, 'r1', { stars: 4, notes: 'Brighter', tastedOn: '2026-10-20' });

    expect(calls.find((c) => c.method === 'update')?.args[0]).toMatchObject({
      stars: 4,
      notes: 'Brighter',
      photo_url: null,
      flavor_notes: [],
      tasted_on: '2026-10-20',
    });
    expect(calls).toContainEqual({ table: 'reviews', method: 'eq', args: ['id', 'r1'] });
  });

  it('throws when the database refuses', async () => {
    const error = new Error('rls');
    const { client } = createFakeSupabase({ reviews: { data: null, error } });
    await expect(updateReview(client, 'r1', { stars: 4 })).rejects.toBe(error);
  });

  it('throws a typed error when RLS hid the row and nothing changed', async () => {
    const { client } = createFakeSupabase({ reviews: { data: [], error: null } });
    await expect(updateReview(client, 'r1', { stars: 4 })).rejects.toBeInstanceOf(
      RowNotChangedError
    );
  });
});

describe('deleteReview', () => {
  it('deletes the tasting, then its photo', async () => {
    const fake = createFakeSupabase({ reviews: { data: [{ id: 'r1' }], error: null } });
    const remove = vi.fn(async () => ({ error: null }));
    const client = Object.assign(fake.client, { storage: { from: () => ({ remove }) } });

    await deleteReview(client, { id: 'r1', photoUrl: PHOTO });

    expect(fake.calls).toContainEqual({ table: 'reviews', method: 'eq', args: ['id', 'r1'] });
    expect(remove).toHaveBeenCalledWith(['u1/2b4c.jpg']);
  });

  it('keeps the photo when the delete fails', async () => {
    const error = new Error('rls');
    const fake = createFakeSupabase({ reviews: { data: null, error } });
    const remove = vi.fn();
    const client = Object.assign(fake.client, { storage: { from: () => ({ remove }) } });

    await expect(deleteReview(client, { id: 'r1', photoUrl: PHOTO })).rejects.toBe(error);
    expect(remove).not.toHaveBeenCalled();
  });

  it('throws a typed error and keeps the photo when no row was deleted', async () => {
    const fake = createFakeSupabase({ reviews: { data: [], error: null } });
    const remove = vi.fn();
    const client = Object.assign(fake.client, { storage: { from: () => ({ remove }) } });

    await expect(deleteReview(client, { id: 'r1', photoUrl: PHOTO })).rejects.toBeInstanceOf(
      RowNotChangedError
    );
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('removeReviewPhoto', () => {
  it('logs a failed removal instead of dropping it silently', async () => {
    const fake = createFakeSupabase({});
    const remove = vi.fn(async () => ({ error: { message: 'storage down' } }));
    const client = Object.assign(fake.client, { storage: { from: () => ({ remove }) } });
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await removeReviewPhoto(client, 'u1/2b4c.jpg');

    expect(log).toHaveBeenCalledWith(
      'Could not remove review photo',
      'u1/2b4c.jpg',
      'storage down'
    );
    log.mockRestore();
  });
});
