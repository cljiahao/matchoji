import { describe, expect, it } from 'vitest';

import { CITY_COOKIE, resolveCity } from './city';

describe('resolveCity', () => {
  it('prefers query over cookie, defaults singapore', () => {
    expect(resolveCity('johor-bahru', 'singapore')).toBe('johor-bahru');
    expect(resolveCity(undefined, 'johor-bahru')).toBe('johor-bahru');
    expect(resolveCity(undefined, undefined)).toBe('singapore');
  });

  it('ignores values that are not a known city', () => {
    expect(resolveCity('atlantis', 'johor-bahru')).toBe('johor-bahru');
    expect(resolveCity('atlantis', 'nowhere')).toBe('singapore');
  });

  it('names the cookie', () => {
    expect(CITY_COOKIE).toBe('matchoji-city');
  });
});
