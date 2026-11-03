import { describe, expect, it } from 'vitest';

import { makeEntry } from '../../../../test/support/journal';
import type { JournalEntry } from '../types';
import { computeJournalStats, computePublicStats, groupByMonth } from './journal-stats';

const TODAY = '2026-11-03';

function entry(
  overrides: Parameters<typeof makeEntry>[0] & { category?: 'matcha' | 'hojicha' } = {}
): JournalEntry {
  const { category = 'matcha', product, ...rest } = overrides;
  return makeEntry({ ...rest, product: { category, ...product } });
}

const tea = (id: string, extra: Parameters<typeof entry>[0] = {}) =>
  entry({ ...extra, product: { id, name: id, ...extra.product } });

describe('computeJournalStats', () => {
  it('handles an empty journal', () => {
    expect(computeJournalStats([], TODAY)).toEqual({
      count: 0,
      teas: 0,
      avgStars: null,
      split: { matcha: 0, hojicha: 0 },
      topNotes: [],
      topMaker: null,
      topRegion: null,
      topPrep: null,
      tastingDays: 0,
      streak: 0,
    });
  });

  it('counts, averages, splits by category and finds the three most-used notes', () => {
    const stats = computeJournalStats(
      [
        entry({ stars: 5, flavorNotes: ['umami', 'creamy'] }),
        entry({ stars: 4, flavorNotes: ['umami', 'sweet'] }),
        entry({ stars: 3, category: 'hojicha', flavorNotes: ['roasty', 'sweet', 'nutty'] }),
      ],
      TODAY
    );
    expect(stats).toMatchObject({
      count: 3,
      avgStars: 4,
      split: { matcha: 2, hojicha: 1 },
      topNotes: ['umami', 'sweet', 'creamy'],
    });
  });

  it('counts a tea logged twice once as a tea but twice as a tasting', () => {
    const stats = computeJournalStats([tea('a'), tea('a'), tea('b')], TODAY);
    expect(stats).toMatchObject({ count: 3, teas: 2 });
  });

  it('shows no top stats from one or two tastings', () => {
    const one = computeJournalStats(
      [tea('a', { product: { brand: 'Ippodo' }, regionName: 'Uji', prep: prep('usucha') })],
      TODAY
    );
    expect(one).toMatchObject({ topMaker: null, topRegion: null, topPrep: null });
    const two = computeJournalStats(
      [tea('a', { product: { brand: 'Ippodo' } }), tea('b', { product: { brand: 'Ippodo' } })],
      TODAY
    );
    expect(two.topMaker).toBeNull();
  });

  it('finds the top maker, region and preparation from three tastings', () => {
    const stats = computeJournalStats(
      [
        tea('a', { product: { brand: 'Ippodo' }, regionName: 'Uji', prep: prep('usucha') }),
        tea('b', { product: { brand: 'Ippodo' }, regionName: 'Uji', prep: prep('usucha') }),
        tea('c', { product: { brand: 'Aiya' }, regionName: 'Nishio', prep: prep('latte') }),
      ],
      TODAY
    );
    expect(stats.topMaker).toEqual({ name: 'Ippodo', count: 2 });
    expect(stats.topRegion).toEqual({ name: 'Uji', count: 2 });
    expect(stats.topPrep).toBe('usucha');
  });

  it('shows no top maker when every maker appears once', () => {
    const stats = computeJournalStats(
      ['A', 'B', 'C'].map((b) => tea(b, { product: { brand: b } })),
      TODAY
    );
    expect(stats.topMaker).toBeNull();
  });

  it('breaks a tie for top maker toward the most recent tasting', () => {
    const stats = computeJournalStats(
      [
        tea('a', { product: { brand: 'Aiya' } }),
        tea('b', { product: { brand: 'Ippodo' } }),
        tea('c', { product: { brand: 'Ippodo' } }),
        tea('d', { product: { brand: 'Aiya' } }),
      ],
      TODAY
    );
    expect(stats.topMaker?.name).toBe('Aiya');
  });

  it('counts tasting days and the longest run this month, ignoring other months', () => {
    const on = (tastedOn: string) => tea('a', { tastedOn });
    const stats = computeJournalStats(
      [
        on('2026-11-03'),
        on('2026-11-03'),
        on('2026-11-02'),
        on('2026-11-01'),
        on('2026-11-09'),
        on('2026-10-31'),
      ],
      TODAY
    );
    expect(stats).toMatchObject({ tastingDays: 4, streak: 3 });
  });

  it('has a streak of one for a single day', () => {
    expect(computeJournalStats([tea('a', { tastedOn: '2026-11-02' })], TODAY)).toMatchObject({
      tastingDays: 1,
      streak: 1,
    });
  });
});

function prep(method: 'usucha' | 'latte') {
  return { method, doseG: null, waterMl: null, waterTempC: null };
}

describe('computePublicStats', () => {
  it('is empty for no tastings', () => {
    expect(computePublicStats([])).toEqual({
      teas: 0,
      split: { matcha: 0, hojicha: 0 },
      topRegion: null,
    });
  });

  it('counts distinct teas and splits them by category', () => {
    const stats = computePublicStats([tea('a'), tea('a'), tea('b', { category: 'hojicha' })]);
    expect(stats).toMatchObject({ teas: 2, split: { matcha: 1, hojicha: 1 } });
  });

  it('needs three teas and a repeated region for a top region', () => {
    const uji = (id: string) => tea(id, { regionName: 'Uji' });
    expect(computePublicStats([uji('a'), uji('b')]).topRegion).toBeNull();
    expect(computePublicStats([uji('a'), uji('b'), tea('c')]).topRegion).toEqual({
      name: 'Uji',
      count: 2,
    });
  });

  it('exposes nothing but counts and a region name', () => {
    const stats = computePublicStats([
      tea('a', { notes: 'private thought', regionName: 'Uji' }),
      tea('b'),
      tea('c'),
    ]);
    expect(JSON.stringify(stats)).not.toContain('private thought');
  });
});

describe('groupByMonth', () => {
  it('orders months newest first and keeps entries newest first within a month', () => {
    const groups = groupByMonth([
      entry({ id: 'a', tastedOn: '2026-09-03' }),
      entry({ id: 'b', tastedOn: '2026-10-21' }),
      entry({ id: 'c', tastedOn: '2026-10-02' }),
    ]);
    expect(groups.map((g) => g.month)).toEqual(['October 2026', 'September 2026']);
    expect(groups[0].entries.map((e) => e.id)).toEqual(['b', 'c']);
  });
});
