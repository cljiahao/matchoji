import { describe, expect, it } from 'vitest';

import { reviewSchema, reviewSchemaFor } from './review.schema';

const full = {
  stars: 4,
  notes: 'Nutty',
  flavorNotes: ['umami', 'creamy'],
  sweetness: 3,
  umami: 5,
  bitterness: 1,
  body: 4,
  prepMethod: 'usucha',
  doseG: 2,
  waterMl: 70,
  waterTempC: 80,
  tastedOn: '2026-10-01',
};

describe('reviewSchema', () => {
  it('accepts a full entry', () => {
    expect(reviewSchema.parse(full)).toMatchObject(full);
  });

  it('accepts stars alone', () => {
    expect(reviewSchema.safeParse({ stars: 5 }).success).toBe(true);
  });

  it('rejects 7 notes and duplicates', () => {
    const seven = ['umami', 'grassy', 'creamy', 'sweet', 'vegetal', 'marine', 'nutty'];
    expect(reviewSchema.safeParse({ stars: 4, flavorNotes: seven }).success).toBe(false);
    expect(reviewSchema.safeParse({ stars: 4, flavorNotes: ['umami', 'umami'] }).success).toBe(
      false
    );
  });

  it('rejects out-of-range taste, dose, water and temperature', () => {
    for (const patch of [
      { umami: 6 },
      { doseG: 51 },
      { waterMl: 1001 },
      { waterTempC: 101 },
      { doseG: -1 },
    ]) {
      expect(reviewSchema.safeParse({ stars: 4, ...patch }).success).toBe(false);
    }
  });

  it('rejects an unknown note, method or a future tasting date', () => {
    expect(reviewSchema.safeParse({ stars: 4, flavorNotes: ['salty'] }).success).toBe(false);
    expect(reviewSchema.safeParse({ stars: 4, prepMethod: 'espresso' }).success).toBe(false);
    expect(reviewSchema.safeParse({ stars: 4, tastedOn: '2999-01-01' }).success).toBe(false);
    expect(reviewSchema.safeParse({ stars: 4, tastedOn: '01/10/2026' }).success).toBe(false);
  });
});

describe('reviewSchemaFor', () => {
  it('rejects a note from the other category', () => {
    expect(reviewSchemaFor('hojicha').safeParse({ stars: 4, flavorNotes: ['umami'] }).success).toBe(
      false
    );
    expect(
      reviewSchemaFor('hojicha').safeParse({ stars: 4, flavorNotes: ['roasty'] }).success
    ).toBe(true);
  });
});

describe('review field details', () => {
  // A per-item refine nests the issue at flavorNotes.0, which the form can't display.
  it('reports a wrong-category note on the flavorNotes field itself', () => {
    const result = reviewSchemaFor('hojicha').safeParse({ stars: 4, flavorNotes: ['umami'] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['flavorNotes']);
  });

  it('treats a cleared date as not recorded', () => {
    expect(reviewSchema.parse({ stars: 4, tastedOn: '' }).tastedOn).toBeUndefined();
  });

  // dose_g is numeric(4,1); a second decimal would be rounded without telling anyone.
  it('rejects a dose with two decimals', () => {
    expect(reviewSchema.safeParse({ stars: 4, doseG: 2.25 }).success).toBe(false);
    expect(reviewSchema.safeParse({ stars: 4, doseG: 2.5 }).success).toBe(true);
  });

  it('explains the allowed range', () => {
    const result = reviewSchema.safeParse({ stars: 4, doseG: 60 });
    expect(result.error?.issues[0].message).toBe('Between 0 and 50');
  });
});
