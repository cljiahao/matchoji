import { describe, expect, it } from 'vitest';

import { discoverHref, discoverProgress, parseDiscoverParams } from './discover-params';

const REGION = '7b0c1c2e-3f4a-4b5c-8d9e-0f1a2b3c4d5e';

describe('parseDiscoverParams', () => {
  it('keeps valid values', () => {
    expect(
      parseDiscoverParams({ q: ' uji ', category: 'matcha', region: REGION, sort: 'newest' })
    ).toEqual({ q: 'uji', category: 'matcha', regionId: REGION, sort: 'newest' });
    expect(parseDiscoverParams({ sort: 'value' })).toEqual({ sort: 'value' });
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

  it('keeps a grade and a listed minimum rating, dropping other ratings', () => {
    expect(parseDiscoverParams({ grade: ' Ceremonial ', rating: '3.5' })).toEqual({
      grade: 'Ceremonial',
      minRating: 3.5,
      sort: 'top',
    });
    expect(parseDiscoverParams({ grade: '   ', rating: '5' })).toEqual({ sort: 'top' });
    expect(parseDiscoverParams({ grade: 'x'.repeat(61), rating: '4.0' })).toEqual({ sort: 'top' });
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
      '/explore?q=uji&category=hojicha&sort=reviewed'
    );
  });

  it('carries grade and rating', () => {
    expect(discoverHref({ sort: 'top' }, { grade: 'Ceremonial', minRating: 4.5 })).toBe(
      '/explore?grade=Ceremonial&rating=4.5'
    );
  });

  it('omits the default sort and cleared values', () => {
    expect(
      discoverHref({ q: 'uji', category: 'matcha', sort: 'top' }, { category: undefined })
    ).toBe('/explore?q=uji');
    expect(discoverHref({ sort: 'top' }, {})).toBe('/explore');
  });

  it('reads a shown count in steps of 12 up to 500, dropping the first step and nonsense', () => {
    expect(parseDiscoverParams({ shown: '24' })).toEqual({ sort: 'top', shown: 24 });
    expect(parseDiscoverParams({ shown: '492' })).toEqual({ sort: 'top', shown: 492 });
    for (const shown of ['12', '0', '-12', '13', '30', '1.5', 'x', '504', '1000'])
      expect(parseDiscoverParams({ shown })).toEqual({ sort: 'top' });
  });

  it('ignores an old ?page= link', () => {
    expect(parseDiscoverParams({ page: '3', q: 'uji' })).toEqual({ q: 'uji', sort: 'top' });
  });

  it('keeps the shown count only when the change is the count itself', () => {
    const current = { q: 'uji', sort: 'top' as const, shown: 24 };
    expect(discoverHref(current, { shown: 36 })).toBe('/explore?q=uji&shown=36');
    expect(discoverHref(current, { shown: 12 })).toBe('/explore?q=uji');
    expect(discoverHref(current, { category: 'matcha' })).toBe('/explore?q=uji&category=matcha');
    expect(discoverHref(current, { sort: 'newest' })).toBe('/explore?q=uji&sort=newest');
  });
});

describe('discoverProgress', () => {
  it('counts what is shown and links to 12 more', () => {
    expect(discoverProgress({ q: 'uji', sort: 'top' }, 12, 30)).toEqual({
      countLabel: 'Showing 12 of 30 teas',
      moreHref: '/explore?q=uji&shown=24',
    });
    expect(discoverProgress({ sort: 'top', shown: 24 }, 24, 30).moreHref).toBe('/explore?shown=36');
  });

  it('drops the link once every tea is shown, and words one tea and none', () => {
    expect(discoverProgress({ sort: 'top', shown: 36 }, 30, 30)).toEqual({
      countLabel: 'Showing 30 of 30 teas',
      moreHref: null,
    });
    expect(discoverProgress({ sort: 'top' }, 1, 1).countLabel).toBe('Showing 1 of 1 tea');
    expect(discoverProgress({ sort: 'top' }, 0, 0).countLabel).toBe('No teas');
  });

  it('stops offering more at the URL cap', () => {
    expect(discoverProgress({ sort: 'top', shown: 492 }, 492, 600).moreHref).toBeNull();
  });
});
