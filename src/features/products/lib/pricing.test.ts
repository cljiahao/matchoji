import { describe, expect, it } from 'vitest';

import { CUP_DOSES, formatGrams, formatSgd, toTeaPrice } from './pricing';

describe('toTeaPrice', () => {
  it('works out the price per gram, coercing numeric strings', () => {
    expect(toTeaPrice({ price_sgd: '32.00', pack_grams: '40.0', price_band: 'mid' })).toEqual({
      sgd: 32,
      packGrams: 40,
      perGram: 0.8,
      band: 'mid',
    });
    expect(toTeaPrice({ price_sgd: 12, pack_grams: 100 })).toMatchObject({ band: null });
  });

  it('is null for an unpriced tea', () => {
    expect(toTeaPrice({ price_sgd: null, pack_grams: null })).toBeNull();
    expect(toTeaPrice({ price_sgd: 10, pack_grams: null })).toBeNull();
    expect(toTeaPrice({})).toBeNull();
  });
});

describe('formatting', () => {
  it('shows dollars to the cent and whole grams without decimals', () => {
    expect(formatSgd(0.8)).toBe('S$0.80');
    expect(formatSgd(24)).toBe('S$24.00');
    expect(formatGrams(40)).toBe('40 g');
    expect(formatGrams(37.5)).toBe('37.5 g');
  });
});

describe('CUP_DOSES', () => {
  it('match the Learn recipes: usucha 2 g, koicha 4 g, a hojicha cup 3 g', () => {
    expect(CUP_DOSES.matcha).toEqual([
      { label: 'usucha', grams: 2 },
      { label: 'koicha', grams: 4 },
    ]);
    expect(CUP_DOSES.hojicha).toEqual([{ label: 'cup', grams: 3 }]);
  });
});
