import { describe, expect, it } from 'vitest';

import { formatMonth, toPricePoint, trendSummary } from './price-history';

const point = (recordedAt: string, price: number, grams = 40) =>
  toPricePoint({ recorded_at: recordedAt, price, pack_grams: grams });

describe('toPricePoint', () => {
  it('reads numeric strings and works out the price per gram', () => {
    expect(
      toPricePoint({ recorded_at: '2026-03-01T00:00:00Z', price: '32.00', pack_grams: '40.0' })
    ).toEqual({ recordedAt: '2026-03-01T00:00:00Z', sgd: 32, packGrams: 40, perGram: 0.8 });
  });
});

describe('formatMonth', () => {
  it('reads the month in UTC', () => {
    expect(formatMonth('2026-03-31T23:30:00Z')).toBe('Mar 2026');
  });
});

describe('trendSummary', () => {
  it('has nothing to say below two points', () => {
    expect(trendSummary([])).toBeNull();
    expect(trendSummary([point('2026-03-01T00:00:00Z', 32)])).toBeNull();
  });

  it('reports a rise, a fall and no change against the first price', () => {
    const first = point('2026-03-05T00:00:00Z', 32);
    expect(trendSummary([first, point('2026-09-01T00:00:00Z', 35.84)])).toBe(
      'Up 12% since Mar 2026'
    );
    expect(trendSummary([first, point('2026-09-01T00:00:00Z', 28.8)])).toBe(
      'Down 10% since Mar 2026'
    );
    expect(trendSummary([first, point('2026-09-01T00:00:00Z', 32)])).toBe(
      'No change since Mar 2026'
    );
  });

  it('compares price per gram, so a bigger pack at the same rate is no change', () => {
    expect(
      trendSummary([point('2026-03-05T00:00:00Z', 32, 40), point('2026-09-01T00:00:00Z', 64, 80)])
    ).toBe('No change since Mar 2026');
  });

  it('does not round a small move to zero', () => {
    expect(
      trendSummary([point('2026-03-05T00:00:00Z', 100), point('2026-09-01T00:00:00Z', 100.2)])
    ).toBe('Up less than 1% since Mar 2026');
  });
});
