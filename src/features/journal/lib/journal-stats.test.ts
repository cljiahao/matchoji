import { describe, expect, it } from 'vitest';

import { makeReview } from '../../../../test/support/render';
import type { JournalEntry } from '../types';
import { computeJournalStats, groupByMonth } from './journal-stats';

function entry(
  overrides: Partial<JournalEntry> & { category?: 'matcha' | 'hojicha' } = {}
): JournalEntry {
  const { category = 'matcha', ...rest } = overrides;
  return {
    ...makeReview(),
    product: { id: 'p1', name: 'Uji', brand: null, category },
    ...rest,
  };
}

describe('computeJournalStats', () => {
  it('handles an empty journal', () => {
    expect(computeJournalStats([])).toEqual({
      count: 0,
      avgStars: null,
      split: { matcha: 0, hojicha: 0 },
      topNotes: [],
    });
  });

  it('counts, averages, splits by category and finds the three most-used notes', () => {
    const stats = computeJournalStats([
      entry({ stars: 5, flavorNotes: ['umami', 'creamy'] }),
      entry({ stars: 4, flavorNotes: ['umami', 'sweet'] }),
      entry({ stars: 3, category: 'hojicha', flavorNotes: ['roasty', 'sweet', 'nutty'] }),
    ]);
    expect(stats).toEqual({
      count: 3,
      avgStars: 4,
      split: { matcha: 2, hojicha: 1 },
      topNotes: ['umami', 'sweet', 'creamy'],
    });
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
