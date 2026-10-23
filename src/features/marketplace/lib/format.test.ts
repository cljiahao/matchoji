import { describe, expect, it } from 'vitest';

import { countryName, formatPrice, shipsToLabel } from './format';

describe('formatPrice', () => {
  it('formats in the listing currency', () => {
    // Intl separates the code with a no-break space.
    expect(formatPrice(32.5, 'SGD')).toBe('SGD\u00a032.50');
    expect(formatPrice(3200, 'JPY')).toBe('¥3,200');
  });

  it('shows an unknown but well-formed code, and falls back for one Intl rejects', () => {
    expect(formatPrice(5, 'ZZZ')).toBe('ZZZ\u00a05.00');
    expect(formatPrice(5, 'bad1')).toBe('bad1 5.00');
  });
});

describe('countryName and shipsToLabel', () => {
  it('names countries and shortens long lists', () => {
    expect(countryName('JP')).toBe('Japan');
    expect(shipsToLabel(['SG', 'JP'])).toBe('Singapore, Japan');
    expect(shipsToLabel(['SG', 'JP', 'MY', 'US', 'GB'])).toBe(
      'Singapore, Japan, Malaysia and 2 more'
    );
  });
});
