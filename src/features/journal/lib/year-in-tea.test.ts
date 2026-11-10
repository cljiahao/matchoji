import { describe, expect, it } from 'vitest';

import { makeEntry } from '../../../../test/support/journal';
import { makeReview } from '../../../../test/support/render';
import type { DrinkJournalEntry } from '../types';
import { computeJournalStats, computePublicStats } from './journal-stats';
import { buildYearInTea, qualifyingYears, toYearCard } from './year-in-tea';

type Over = Parameters<typeof makeEntry>[0];

const at = (tastedOn: string, over: Over = {}) =>
  makeEntry({
    tastedOn,
    stars: 4,
    ...over,
    product: { id: tastedOn, name: `Tea ${tastedOn}`, ...over?.product },
  });

describe('qualifyingYears', () => {
  it('lists years with at least three tastings, newest first', () => {
    const entries = [
      at('2026-01-01'),
      at('2026-02-01'),
      at('2026-03-01'),
      at('2025-01-01'),
      at('2025-02-01'),
      at('2024-01-01'),
      at('2024-02-01'),
      at('2024-03-01'),
    ];
    expect(qualifyingYears(entries)).toEqual([2026, 2024]);
  });

  it('is empty without three tastings in any year', () => {
    expect(qualifyingYears([])).toEqual([]);
    expect(qualifyingYears([at('2026-01-01'), at('2026-02-01')])).toEqual([]);
  });
});

describe('buildYearInTea', () => {
  it('is null below three tastings that year, even with many in other years', () => {
    const entries = [
      at('2026-01-01'),
      at('2026-02-01'),
      at('2025-03-01'),
      at('2025-04-01'),
      at('2025-05-01'),
    ];
    expect(buildYearInTea(entries, 2026)).toBeNull();
    expect(buildYearInTea(entries, 2025)).not.toBeNull();
    expect(buildYearInTea([], 2026)).toBeNull();
  });

  it('totals the year and finds its first and latest tasting', () => {
    const recap = buildYearInTea(
      [
        at('2026-09-01', { stars: 5, product: { id: 'x', category: 'hojicha' } }),
        at('2026-05-01', { stars: 3 }),
        at('2026-02-01', { stars: 4 }),
        at('2025-12-31', { stars: 1 }),
      ],
      2026
    );
    expect(recap).toMatchObject({
      year: 2026,
      tastings: 3,
      teas: 3,
      split: { matcha: 2, hojicha: 1 },
      avgStars: 4,
      first: { tea: 'Tea 2026-02-01', date: '2026-02-01' },
      latest: { tea: 'Tea 2026-09-01', date: '2026-09-01' },
    });
  });

  it('picks the highest-rated tea, the later tasting winning a tie', () => {
    const recap = buildYearInTea(
      [
        at('2026-03-01', { stars: 5 }),
        at('2026-02-01', { stars: 5 }),
        at('2026-01-01', { stars: 2 }),
      ],
      2026
    );
    expect(recap?.topRated).toMatchObject({ tea: 'Tea 2026-03-01', stars: 5 });
  });

  it('finds the busiest month, the later month winning a tie', () => {
    const tied = buildYearInTea(
      [at('2026-03-01'), at('2026-03-09'), at('2026-07-01'), at('2026-07-09')],
      2026
    );
    expect(tied?.busiestMonth).toEqual({ label: 'July', count: 2 });
    const clear = buildYearInTea(
      [at('2026-03-01'), at('2026-03-02'), at('2026-03-03'), at('2026-07-01')],
      2026
    );
    expect(clear?.busiestMonth).toEqual({ label: 'March', count: 3 });
  });

  it('names the newest maker first tried this year, ignoring makers known from before', () => {
    const maker = (brand: string) => ({ product: { brand } });
    const recap = buildYearInTea(
      [
        at('2026-08-01', maker('Aiya')),
        at('2026-06-01', maker('Ippodo')),
        at('2026-03-01', maker('Marukyu')),
        at('2025-05-01', maker('Ippodo')),
      ],
      2026
    );
    expect(recap?.newestMaker).toEqual({
      maker: 'Aiya',
      tea: 'Tea 2026-08-01',
      date: '2026-08-01',
    });
  });

  it('has no newest maker when every maker is known or unnamed', () => {
    const recap = buildYearInTea(
      [
        at('2026-01-01'),
        at('2026-02-01'),
        at('2026-03-01', { product: { brand: 'Ippodo' } }),
        at('2025-01-01', { product: { brand: 'Ippodo' } }),
      ],
      2026
    );
    expect(recap?.newestMaker).toBeNull();
  });

  it('reports no baseline in a first year', () => {
    const recap = buildYearInTea(
      [at('2026-01-01', { stars: 5, flavorNotes: ['sweet'] }), at('2026-02-01'), at('2026-03-01')],
      2026
    );
    expect(recap?.taste).toMatchObject({ hasBaseline: false, shifts: [], newNotes: [] });
    expect(recap?.taste.favouriteNotes).toEqual(['sweet']);
  });

  it('reports how the liked profile moved against earlier years', () => {
    const liked = (date: string, sweetness: number, notes: string[] = []) =>
      at(date, { stars: 5, profile: { sweetness, body: 3 }, flavorNotes: notes });
    const recap = buildYearInTea(
      [
        liked('2026-01-01', 5, ['creamy']),
        liked('2026-02-01', 5, ['creamy']),
        liked('2026-03-01', 4.5),
        liked('2025-01-01', 2, ['grassy']),
      ],
      2026
    );
    expect(recap?.taste.hasBaseline).toBe(true);
    expect(recap?.taste.shifts).toHaveLength(1);
    expect(recap?.taste.shifts[0]).toMatchObject({ attribute: 'sweetness', toward: 'Sweet' });
    expect(recap?.taste.newNotes).toContain('creamy');
  });
});

describe('toYearCard', () => {
  it('carries counts and tea names only, never notes', () => {
    const recap = buildYearInTea(
      [
        at('2026-01-01', { notes: 'secret note one', stars: 5 }),
        at('2026-02-01', { notes: 'secret note two' }),
        at('2026-03-01', { notes: 'secret note three' }),
      ],
      2026
    );
    const card = toYearCard(recap!, 'Mei');
    expect(card).toEqual({
      taster: 'Mei',
      year: 2026,
      tastings: 3,
      teas: 3,
      split: { matcha: 3, hojicha: 0 },
      topRated: { tea: 'Tea 2026-01-01', stars: 5 },
      busiestMonth: expect.any(String),
    });
    expect(JSON.stringify(recap)).not.toContain('secret');
  });
});

describe('with drink reviews in the journal', () => {
  const drinkEntry = (tastedOn: string): DrinkJournalEntry => ({
    ...makeReview({ tastedOn, productId: null, drinkId: 'd1', stars: 5 }),
    drink: {
      id: 'd1',
      slug: 'hojicha-latte',
      name: 'Hojicha Latte',
      base: 'hojicha',
      cafe: { id: 'c1', slug: 'kurasu', name: 'Kurasu' },
    },
  });

  it('year-in-tea ignores drink reviews', () => {
    const items = [
      at('2026-01-01'),
      at('2026-02-01'),
      drinkEntry('2026-03-01'),
      drinkEntry('2026-04-01'),
    ];
    // Two teas plus two drinks is still below the three-tasting bar.
    expect(buildYearInTea(items, 2026)).toBeNull();
    expect(qualifyingYears(items)).toEqual([]);

    const recap = buildYearInTea([...items, at('2026-05-01')], 2026);
    expect(recap?.tastings).toBe(3);
    expect(recap?.topRated.stars).toBe(4);
  });

  it('journal stats count teas only', () => {
    const stats = computeJournalStats([at('2026-01-01'), drinkEntry('2026-03-01')], '2026-03-02');
    expect(stats).toMatchObject({ count: 1, teas: 1, avgStars: 4 });
    expect(computePublicStats([drinkEntry('2026-03-01')])).toMatchObject({ teas: 0 });
  });
});
