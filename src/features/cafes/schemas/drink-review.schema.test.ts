import { describe, expect, it } from 'vitest';

import { drinkReviewSchemaFor } from './drink-review.schema';

const POST = 'https://www.instagram.com/p/Cabc_123-x/';

describe('drinkReviewSchemaFor', () => {
  it('taster schema requires instagramUrl and disclosure', () => {
    const schema = drinkReviewSchemaFor({ isTaster: true, base: 'matcha' });
    const result = schema.safeParse({ stars: 4 });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path[0]);
    expect(paths).toContain('instagramUrl');
    expect(paths).toContain('disclosure');

    expect(schema.safeParse({ stars: 4, instagramUrl: POST, disclosure: 'gifted' }).success).toBe(
      true
    );
    expect(schema.safeParse({ stars: 4, instagramUrl: POST, disclosure: 'none' }).success).toBe(
      true
    );
  });

  it('community schema has no instagramUrl', () => {
    const schema = drinkReviewSchemaFor({ isTaster: false, base: 'matcha' });
    const result = schema.safeParse({
      stars: 4,
      instagramUrl: POST,
      disclosure: 'paid',
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ stars: 4 });
  });

  it('roast only for hojicha', () => {
    const hojicha = drinkReviewSchemaFor({ isTaster: false, base: 'hojicha' });
    expect(hojicha.parse({ stars: 4, roast: 3 })).toMatchObject({ roast: 3 });

    const matcha = drinkReviewSchemaFor({ isTaster: false, base: 'matcha' });
    expect(matcha.parse({ stars: 4, roast: 3 })).not.toHaveProperty('roast');
  });

  it('rejects non-instagram url', () => {
    const schema = drinkReviewSchemaFor({ isTaster: true, base: 'matcha' });
    for (const url of [
      'https://example.com/p/abc/',
      'http://www.instagram.com/p/abc/',
      'https://www.instagram.com/someone/',
      'https://www.instagram.com/p/abc/?utm=1',
    ]) {
      const result = schema.safeParse({ stars: 4, instagramUrl: url, disclosure: 'none' });
      expect(result.success, url).toBe(false);
    }
  });

  it('keeps only flavour notes that suit the base and counts blanks as unset', () => {
    const schema = drinkReviewSchemaFor({ isTaster: false, base: 'matcha' });
    expect(schema.safeParse({ stars: 4, flavorNotes: ['roasty'] }).success).toBe(false);
    expect(schema.parse({ stars: 4, teaStrength: '', sweetness: '', notes: ' ok ' })).toEqual({
      stars: 4,
      notes: 'ok',
    });
  });

  it('rejects a missing rating and out-of-range scales', () => {
    const schema = drinkReviewSchemaFor({ isTaster: false, base: 'matcha' });
    expect(schema.safeParse({ stars: 0 }).success).toBe(false);
    expect(schema.safeParse({ stars: 4, teaStrength: 6 }).success).toBe(false);
  });
});
