import { describe, expect, it } from 'vitest';

import { formatChange, percentChange, summarizeSupply } from './summarize-supply';

type Row = Parameters<typeof summarizeSupply>[0][number];

const stat = (
  prefecture: string,
  year: number,
  metric: Row['metric'],
  value: number | string,
  source: Row['source'] = 'maff'
) => ({ prefecture, year, metric, value: value as number, source });

const regions = [
  { id: 'uji', name: 'Uji, Kyoto', prefecture: 'Kyoto' },
  { id: 'nishio', name: 'Nishio, Aichi', prefecture: 'Aichi' },
  { id: 'none', name: 'Nowhere', prefecture: null },
];

describe('summarizeSupply', () => {
  const overview = summarizeSupply(
    [
      stat('Shizuoka', 2025, 'aracha_t', 24100),
      stat('Kyoto', 2025, 'cultivated_ha', 1510),
      stat('Kyoto', 2024, 'cultivated_ha', '1500'),
      stat('Kyoto', 2025, 'aracha_t', 2280),
      stat('Kyoto', 2025, 'aracha_t', 2121, 'zencharen'),
      stat('Kyoto', 2025, 'tencha_t', 989, 'zencharen'),
      stat('Aichi', 2025, 'aracha_t', 561, 'zencharen'),
      stat('Aichi', 2025, 'tencha_t', 463, 'zencharen'),
      stat('Japan', 2025, 'aracha_t', 75100),
    ],
    regions
  );

  it('separates the national figure and orders prefectures by tencha, then raw tea', () => {
    expect(overview.national?.rawTea).toEqual([{ year: 2025, value: 75100 }]);
    expect(overview.prefectures.map((p) => p.prefecture)).toEqual(['Kyoto', 'Aichi', 'Shizuoka']);
  });

  it('builds MAFF series oldest first, coercing string values, without federation rows', () => {
    const kyoto = overview.prefectures[0];
    expect(kyoto.fields).toEqual([
      { year: 2024, value: 1500 },
      { year: 2025, value: 1510 },
    ]);
    expect(kyoto.rawTea).toEqual([{ year: 2025, value: 2280 }]);
    expect(kyoto.regions).toEqual([{ id: 'uji', name: 'Uji, Kyoto' }]);
  });

  it('takes the tencha share against the federation’s own total', () => {
    expect(overview.prefectures[0].tencha).toEqual({
      year: 2025,
      tonnes: 989,
      share: 989 / 2121,
    });
    expect(overview.prefectures[2].tencha).toBeNull();
  });

  it('has no national figure or prefectures without rows', () => {
    expect(summarizeSupply([], regions)).toEqual({ national: null, prefectures: [] });
  });
});

describe('percentChange', () => {
  it('compares the last point with the first', () => {
    expect(
      percentChange([
        { year: 2018, value: 200 },
        { year: 2019, value: 1 },
        { year: 2025, value: 150 },
      ])
    ).toBe(-25);
  });

  it('is null with fewer than two points or a zero start', () => {
    expect(percentChange([{ year: 2025, value: 5 }])).toBeNull();
    expect(
      percentChange([
        { year: 2024, value: 0 },
        { year: 2025, value: 5 },
      ])
    ).toBeNull();
  });
});

describe('formatChange', () => {
  it('rounds to a signed whole percent and calls near-zero flat', () => {
    expect(formatChange(12.6)).toBe('+13%');
    expect(formatChange(-4.4)).toBe('−4%');
    expect(formatChange(0.3)).toBe('flat');
  });
});
