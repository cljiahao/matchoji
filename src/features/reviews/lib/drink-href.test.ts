import { describe, expect, it } from 'vitest';

import { drinkHref } from './drink-href';

describe('drinkHref', () => {
  it('nests the drink under its café', () => {
    expect(drinkHref('kurasu', 'hojicha-latte')).toBe('/cafes/kurasu/hojicha-latte');
  });
});
