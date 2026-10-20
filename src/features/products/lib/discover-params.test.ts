import { describe, expect, it } from 'vitest';

import { discoverHref, parseDiscoverParams } from './discover-params';

const REGION = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';

describe('parseDiscoverParams', () => {
  it('keeps valid values', () => {
    expect(
      parseDiscoverParams({ q: ' uji ', category: 'matcha', region: REGION, sort: 'newest' })
    ).toEqual({ q: 'uji', category: 'matcha', regionId: REGION, sort: 'newest' });
  });

  it('ignores invalid values', () => {
    expect(parseDiscoverParams({ sort: 'foo', region: 'abc', category: 'sencha' })).toEqual({
      sort: 'top',
    });
  });

  // A query that strips to nothing must behave like no query, not reach PostgREST.
  it('drops blank q', () => {
    expect(parseDiscoverParams({ q: '  ,() ' })).toEqual({ sort: 'top' });
  });

  it('takes the first value of repeated params', () => {
    expect(parseDiscoverParams({ category: ['hojicha', 'matcha'] })).toEqual({
      category: 'hojicha',
      sort: 'top',
    });
  });
});

describe('discoverHref', () => {
  it('keeps the other filters when one changes', () => {
    expect(discoverHref({ q: 'uji', sort: 'reviewed' }, { category: 'hojicha' })).toBe(
      '/?q=uji&category=hojicha&sort=reviewed'
    );
  });

  it('omits the default sort and cleared values', () => {
    expect(
      discoverHref({ q: 'uji', category: 'matcha', sort: 'top' }, { category: undefined })
    ).toBe('/?q=uji');
    expect(discoverHref({ sort: 'top' }, {})).toBe('/');
  });
});
