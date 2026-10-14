import { describe, expect, it } from 'vitest';

import { buildSearchFilter } from './search-filter';

describe('buildSearchFilter', () => {
  it('matches name or brand case-insensitively', () => {
    expect(buildSearchFilter('ippodo')).toBe('name.ilike.%ippodo%,brand.ilike.%ippodo%');
  });

  it('returns null for blank input', () => {
    expect(buildSearchFilter('   ')).toBeNull();
  });

  // Commas and parentheses are PostgREST filter syntax; left in, a query like
  // "a,id.eq.x" would inject an extra OR condition.
  it('strips PostgREST syntax characters so user text cannot add conditions', () => {
    expect(buildSearchFilter('a,id.eq.x')).toBe('name.ilike.%a id.eq.x%,brand.ilike.%a id.eq.x%');
    expect(buildSearchFilter('(uji)*%')).toBe('name.ilike.%uji%,brand.ilike.%uji%');
  });

  it('returns null when only syntax characters were typed', () => {
    expect(buildSearchFilter(',()')).toBeNull();
  });
});
