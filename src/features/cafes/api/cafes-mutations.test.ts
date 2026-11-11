import { describe, expect, it } from 'vitest';

import { RowNotChangedError } from '@/features/reviews';

import { createFakeSupabase } from '../../../../test/support/fake-supabase';
import {
  CAFE_EXISTS_MESSAGE,
  DAILY_LIMIT_MESSAGE,
  FriendlyError,
  PENDING_CAFES_MESSAGE,
  PENDING_DRINKS_MESSAGE,
  REVIEW_DENIED_MESSAGE,
  REVIEW_GONE_MESSAGE,
  REVIEW_INVALID_MESSAGE,
  createCafe,
  createDrink,
  createDrinkReview,
  drinkReviewErrorMessage,
  updateDrinkReview,
} from './cafes-mutations';

const CAFE_ROW = {
  id: 'c1',
  slug: 'matcha-bar-orchard',
  name: 'Matcha Bar',
  city_slug: 'singapore',
  area: 'Orchard',
  address: null,
  lat: null,
  lng: null,
  instagram_handle: 'matcha.bar',
  website_url: null,
  status: 'pending',
  merged_into: null,
};

const DRINK_ROW = {
  id: 'd1',
  cafe_id: 'c1',
  slug: 'hojicha-latte',
  name: 'Hojicha latte',
  base: 'hojicha',
  style: 'latte',
  serving: 'both',
  price: '6.50',
  currency: 'SGD',
  photo_url: null,
  photo_credit: null,
  tea_product_id: null,
  status: 'pending',
  merged_into: null,
};

const capError = { code: 'P0001', message: 'You have too many cafés waiting for review.' };

describe('createCafe', () => {
  it('inserts a suggestion and returns the pending café', async () => {
    const fake = createFakeSupabase({ cafes: { data: CAFE_ROW, error: null } });
    const cafe = await createCafe(fake.client, {
      name: 'Matcha Bar',
      citySlug: 'singapore',
      area: 'Orchard',
      instagramHandle: 'matcha.bar',
    });

    expect(fake.calls.find((c) => c.method === 'insert')?.args[0]).toEqual({
      name: 'Matcha Bar',
      city_slug: 'singapore',
      area: 'Orchard',
      address: null,
      instagram_handle: 'matcha.bar',
      website_url: null,
    });
    expect(cafe).toMatchObject({ id: 'c1', slug: 'matcha-bar-orchard', status: 'pending' });
    const select = fake.calls.find((c) => c.method === 'select');
    expect(select?.args[0]).not.toContain('*');
    expect(select?.args[0]).not.toContain('added_by');
  });

  it('maps pending-cap error to friendly message', async () => {
    const fake = createFakeSupabase({ cafes: { data: null, error: capError } });
    const failure = createCafe(fake.client, { name: 'X', citySlug: 'singapore' });
    await expect(failure).rejects.toThrow(PENDING_CAFES_MESSAGE);
    await expect(failure).rejects.toBeInstanceOf(FriendlyError);
    expect(PENDING_CAFES_MESSAGE).toBe(
      "You have too many cafés waiting for review. Try again once they're approved."
    );
  });

  it('maps the daily cap and a duplicate café to friendly messages', async () => {
    const daily = { code: 'P0001', message: 'That is a lot for one day. Try again tomorrow.' };
    const dailyFake = createFakeSupabase({ cafes: { data: null, error: daily } });
    const dailyFailure = createCafe(dailyFake.client, { name: 'X', citySlug: 'singapore' });
    await expect(dailyFailure).rejects.toThrow(DAILY_LIMIT_MESSAGE);
    await expect(dailyFailure).rejects.toBeInstanceOf(FriendlyError);

    const dupe = { code: '23505', message: 'cafes_city_name_area_key' };
    const dupeFake = createFakeSupabase({ cafes: { data: null, error: dupe } });
    await expect(createCafe(dupeFake.client, { name: 'X', citySlug: 'singapore' })).rejects.toThrow(
      CAFE_EXISTS_MESSAGE
    );
  });

  it('rethrows any other database error untouched', async () => {
    const error = { code: '42501', message: 'denied' };
    const fake = createFakeSupabase({ cafes: { data: null, error } });
    await expect(createCafe(fake.client, { name: 'X', citySlug: 'singapore' })).rejects.toBe(error);
  });
});

describe('createDrink', () => {
  const input = {
    cafeId: 'c1',
    name: 'Hojicha latte',
    base: 'hojicha' as const,
    style: 'latte' as const,
    serving: 'both' as const,
    price: 6.5,
  };

  it('inserts without a photo, status or currency and maps the row', async () => {
    const fake = createFakeSupabase({ drinks: { data: DRINK_ROW, error: null } });
    const drink = await createDrink(fake.client, input);

    expect(fake.calls.find((c) => c.method === 'insert')?.args[0]).toEqual({
      cafe_id: 'c1',
      name: 'Hojicha latte',
      base: 'hojicha',
      style: 'latte',
      serving: 'both',
      price: 6.5,
    });
    expect(drink).toMatchObject({ id: 'd1', cafeId: 'c1', price: 6.5, currency: 'SGD' });
  });

  it('maps pending-cap error to friendly message', async () => {
    const error = { code: 'P0001', message: 'You have too many drinks waiting for review.' };
    const fake = createFakeSupabase({ drinks: { data: null, error } });
    await expect(createDrink(fake.client, input)).rejects.toThrow(PENDING_DRINKS_MESSAGE);
  });

  it('maps the daily cap to a friendly message', async () => {
    const error = { code: 'P0001', message: 'That is a lot for one day. Try again tomorrow.' };
    const fake = createFakeSupabase({ drinks: { data: null, error } });
    await expect(createDrink(fake.client, input)).rejects.toThrow(DAILY_LIMIT_MESSAGE);
  });

  it('says so when the café already lists that drink', async () => {
    const fake = createFakeSupabase({
      drinks: { data: null, error: { code: '23505', message: 'drinks_cafe_name_key' } },
    });
    await expect(createDrink(fake.client, input)).rejects.toThrow(/already listed/);
  });
});

describe('createDrinkReview', () => {
  it('inserts drink_id not product_id', async () => {
    const fake = createFakeSupabase({ reviews: { data: [{ id: 'r1' }], error: null } });
    await createDrinkReview(fake.client, 'd1', {
      userId: 'u1',
      stars: 5,
      notes: 'Toasty',
      teaStrength: 4,
      roast: 3,
      tastedOn: '2026-11-01',
      instagramUrl: 'https://www.instagram.com/p/abc/',
      disclosure: 'gifted',
    });

    const row = fake.calls.find((c) => c.method === 'insert')?.args[0];
    expect(row).toMatchObject({
      drink_id: 'd1',
      user_id: 'u1',
      stars: 5,
      tea_strength: 4,
      roast: 3,
      instagram_url: 'https://www.instagram.com/p/abc/',
      disclosure: 'gifted',
      tasted_on: '2026-11-01',
    });
    expect(row).not.toHaveProperty('product_id');
  });

  it("defaults a community review's disclosure to none with no link", async () => {
    const fake = createFakeSupabase({ reviews: { data: [{ id: 'r1' }], error: null } });
    await createDrinkReview(fake.client, 'd1', { userId: 'u1', stars: 3 });
    expect(fake.calls.find((c) => c.method === 'insert')?.args[0]).toMatchObject({
      instagram_url: null,
      disclosure: 'none',
      flavor_notes: [],
    });
  });

  it('throws the database error', async () => {
    const error = {
      code: '23514',
      message: "A taster's drink review needs the Instagram post link.",
    };
    const fake = createFakeSupabase({ reviews: { data: null, error } });
    await expect(createDrinkReview(fake.client, 'd1', { userId: 'u1', stars: 3 })).rejects.toBe(
      error
    );
  });
});

describe('updateDrinkReview', () => {
  it('updates the review by id and never touches drink or author', async () => {
    const fake = createFakeSupabase({ reviews: { data: [{ id: 'r1' }], error: null } });
    await updateDrinkReview(fake.client, 'r1', { stars: 2, tastedOn: '2026-11-02' });

    const patch = fake.calls.find((c) => c.method === 'update')?.args[0];
    expect(patch).toMatchObject({ stars: 2, tasted_on: '2026-11-02', disclosure: 'none' });
    expect(patch).not.toHaveProperty('drink_id');
    expect(patch).not.toHaveProperty('user_id');
    expect(fake.calls).toContainEqual({ table: 'reviews', method: 'eq', args: ['id', 'r1'] });
  });

  it('throws on a refused update', async () => {
    const error = { code: '42501' };
    const fake = createFakeSupabase({ reviews: { data: null, error } });
    await expect(updateDrinkReview(fake.client, 'r1', { stars: 2 })).rejects.toBe(error);
  });

  it('throws a typed error when no row was changed', async () => {
    const fake = createFakeSupabase({ reviews: { data: [], error: null } });
    await expect(updateDrinkReview(fake.client, 'r1', { stars: 2 })).rejects.toBeInstanceOf(
      RowNotChangedError
    );
  });
});

describe('drinkReviewErrorMessage', () => {
  it('maps RLS denial, check violations and a vanished row to friendly lines', () => {
    expect(drinkReviewErrorMessage({ code: '42501', message: 'new row violates' })).toBe(
      REVIEW_DENIED_MESSAGE
    );
    expect(drinkReviewErrorMessage({ code: '23514', message: 'check' })).toBe(
      REVIEW_INVALID_MESSAGE
    );
    expect(drinkReviewErrorMessage(new RowNotChangedError('x'))).toBe(REVIEW_GONE_MESSAGE);
  });

  it('passes a FriendlyError through and hides anything else', () => {
    expect(drinkReviewErrorMessage(new FriendlyError('Too many.'))).toBe('Too many.');
    const message = drinkReviewErrorMessage(new Error('boom: secret detail'));
    expect(message).toMatch(/Could not save that rating/);
    expect(message).not.toMatch(/secret/);
    expect(drinkReviewErrorMessage(null)).toMatch(/Could not save that rating/);
  });
});
