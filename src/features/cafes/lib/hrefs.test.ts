import { describe, expect, it } from 'vitest';

import { drinkHref as reviewsDrinkHref } from '@/features/reviews';

import { cafeHref, cityHref, drinkHref, shortCafeHref } from './hrefs';

describe('hrefs', () => {
  it('builds café, drink and short links', () => {
    expect(cafeHref('kurasu-bugis')).toBe('/cafes/kurasu-bugis');
    expect(drinkHref('kurasu-bugis', 'hojicha-latte')).toBe('/cafes/kurasu-bugis/hojicha-latte');
    expect(shortCafeHref('kurasu-bugis')).toBe('/c/kurasu-bugis');
  });

  it('names a city page by its query form', () => {
    expect(cityHref('/cafes', 'johor-bahru')).toBe('/cafes?city=johor-bahru');
    expect(cityHref('/', 'singapore')).toBe('/?city=singapore');
  });

  it('shares the single drinkHref implementation with reviews', () => {
    expect(drinkHref).toBe(reviewsDrinkHref);
  });
});
