import { describe, expect, it } from 'vitest';

import {
  MIN_VALUE_POOL,
  MIN_VALUE_RATINGS,
  computeValueScores,
  percentile,
  type ValueInput,
} from './value-score';

const input = (
  id: string,
  avgStars: number,
  perGram: number,
  overrides: Partial<ValueInput> = {}
): ValueInput => ({
  id,
  category: 'matcha',
  avgStars,
  reviewCount: MIN_VALUE_RATINGS,
  perGram,
  ...overrides,
});

describe('percentile', () => {
  it('places a value from 0 (lowest) to 1 (highest), sharing ties', () => {
    expect(percentile(1, [1, 2, 3])).toBe(0);
    expect(percentile(2, [1, 2, 3])).toBe(0.5);
    expect(percentile(3, [1, 2, 3])).toBe(1);
    expect(percentile(2, [2, 2, 3])).toBe(0.25);
    expect(percentile(5, [5])).toBe(0.5);
  });
});

describe('computeValueScores', () => {
  // Ratings rise and price falls with the letter: "a" is the bargain, "e" the poor deal.
  const pool = [
    input('a', 4.8, 0.5),
    input('b', 4.5, 0.7),
    input('c', 4.2, 0.9),
    input('d', 4.0, 1.2),
    input('e', 3.5, 2.0),
  ];

  it('scores rating percentile minus price percentile within a category', () => {
    const scores = computeValueScores(pool);
    expect(scores.get('a')).toMatchObject({
      ratingPercentile: 1,
      pricePercentile: 0,
      score: 1,
      great: true,
    });
    expect(scores.get('e')).toMatchObject({ score: -1, great: false });
  });

  it('calls only a clear win great: a well-rated tea priced above its rating is not', () => {
    const scores = computeValueScores([
      ...pool,
      input('dear', 4.9, 3.0),
      input('cheapPoor', 3.0, 0.3),
    ]);
    expect(scores.get('dear')?.great).toBe(false);
    // Cheapest but worst rated: a high score is not enough without a rating in the top half.
    expect(scores.get('cheapPoor')?.great).toBe(false);
  });

  it('compares matcha and hojicha separately', () => {
    const hojicha = pool.map((t) => ({ ...t, id: `h-${t.id}`, category: 'hojicha' as const }));
    const scores = computeValueScores([...pool, ...hojicha]);
    expect(scores.get('a')?.score).toBe(1);
    expect(scores.get('h-a')?.score).toBe(1);
  });

  it('skips teas with too few ratings or no price, and pools that are too small', () => {
    const scores = computeValueScores([
      ...pool,
      input('thin', 5, 0.1, { reviewCount: MIN_VALUE_RATINGS - 1 }),
      input('unpriced', 5, 0.1, { perGram: null }),
    ]);
    expect(scores.has('thin')).toBe(false);
    expect(scores.has('unpriced')).toBe(false);
    expect(scores.size).toBe(pool.length);
    expect(computeValueScores(pool.slice(0, MIN_VALUE_POOL - 1)).size).toBe(0);
  });
});
