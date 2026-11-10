import { describe, expect, it } from 'vitest';

import { drinkHref as reviewsDrinkHref } from '@/features/reviews';

import { cafeHref, drinkHref, shortCafeHref } from './hrefs';

describe('hrefs', () => {
  it('builds café, drink and short links', () => {
    expect(cafeHref('kurasu-bugis')).toBe('/cafes/kurasu-bugis');
    expect(drinkHref('kurasu-bugis', 'hojicha-latte')).toBe('/cafes/kurasu-bugis/hojicha-latte');
    expect(shortCafeHref('kurasu-bugis')).toBe('/c/kurasu-bugis');
  });

  it('shares the single drinkHref implementation with reviews', () => {
    expect(drinkHref).toBe(reviewsDrinkHref);
  });
});
