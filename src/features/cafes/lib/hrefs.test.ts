import { describe, expect, it } from 'vitest';

import { drinkHref as reviewsDrinkHref } from '@/features/reviews';

import { cafeHref, drinkHref } from './hrefs';

describe('hrefs', () => {
  it('builds café and drink links', () => {
    expect(cafeHref('kurasu-bugis')).toBe('/cafes/kurasu-bugis');
    expect(drinkHref('kurasu-bugis', 'hojicha-latte')).toBe('/cafes/kurasu-bugis/hojicha-latte');
  });

  it('shares the single drinkHref implementation with reviews', () => {
    expect(drinkHref).toBe(reviewsDrinkHref);
  });
});
