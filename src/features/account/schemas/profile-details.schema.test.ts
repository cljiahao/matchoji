import { describe, expect, it } from 'vitest';

import { isInstagramHandle, profileDetailsSchema } from './profile-details.schema';

const parse = (instagramHandle: string | null) =>
  profileDetailsSchema.safeParse({ instagramHandle, bio: null });

describe('profileDetailsSchema handle', () => {
  it('accepts letters, digits, dots and underscores', () => {
    expect(parse('matcha.bar_1')).toMatchObject({
      success: true,
      data: { instagramHandle: 'matcha.bar_1' },
    });
  });

  it('turns a blank handle into null', () => {
    expect(parse('  ')).toMatchObject({ success: true, data: { instagramHandle: null } });
  });

  it('rejects a handle made only of dots', () => {
    for (const handle of ['.', '..', '...']) {
      expect(parse(handle).success).toBe(false);
      expect(isInstagramHandle(handle)).toBe(false);
    }
  });

  it('rejects spaces, an @ and over-long handles', () => {
    for (const handle of ['a b', '@a', 'a'.repeat(31)]) expect(parse(handle).success).toBe(false);
  });
});
