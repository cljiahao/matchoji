import { describe, expect, it } from 'vitest';

import {
  ALL_DRINK_LISTS,
  drinkListSlug,
  drinkListTitle,
  parseDrinkListSlug,
  topDrinksHref,
  topTeasHref,
} from './top-lists';

describe('drink top lists', () => {
  it('builds slugs like singapore-hojicha-latte', () => {
    expect(drinkListSlug({ city: 'singapore', base: 'hojicha', style: 'latte' })).toBe(
      'singapore-hojicha-latte'
    );
    expect(drinkListSlug({ city: 'johor-bahru', base: 'matcha', style: 'iced_latte' })).toBe(
      'johor-bahru-matcha-iced-latte'
    );
  });

  it('offers every city × base × style but not "other"', () => {
    expect(ALL_DRINK_LISTS).toHaveLength(16);
    expect(ALL_DRINK_LISTS.some((k) => k.style === 'other')).toBe(false);
  });

  it('parses only known slugs, so an old tea slug is not mistaken for a drink list', () => {
    expect(parseDrinkListSlug('johor-bahru-matcha-straight')).toEqual({
      city: 'johor-bahru',
      base: 'matcha',
      style: 'straight',
    });
    expect(parseDrinkListSlug('matcha')).toBeUndefined();
    expect(parseDrinkListSlug('singapore-matcha-other')).toBeUndefined();
  });

  it('titles lists in plain words', () => {
    expect(drinkListTitle({ city: 'singapore', base: 'hojicha', style: 'latte' })).toBe(
      'Top hojicha lattes in Singapore'
    );
    expect(drinkListTitle({ city: 'johor-bahru', base: 'matcha', style: 'straight' })).toBe(
      'Top straight matcha in Johor Bahru'
    );
  });

  it('links drink lists to /top/<slug> and tea lists to /top/teas', () => {
    expect(topDrinksHref({ city: 'singapore', base: 'hojicha', style: 'latte' })).toBe(
      '/top/singapore-hojicha-latte'
    );
    expect(topTeasHref()).toBe('/top/teas');
    expect(topTeasHref('best-value-matcha')).toBe('/top/teas/best-value-matcha');
  });
});
