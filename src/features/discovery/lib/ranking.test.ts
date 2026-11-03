import { describe, expect, it } from 'vitest';

import { tea } from '../test-utils';
import { PRIOR_WEIGHT, bayesianScore, priorMeanOf, rankTeas } from './ranking';

describe('bayesianScore', () => {
  it('pulls a thin average toward the catalogue mean and trusts a thick one', () => {
    expect(bayesianScore(5, 1, 4)).toBeCloseTo((5 + PRIOR_WEIGHT * 4) / (1 + PRIOR_WEIGHT));
    expect(bayesianScore(4.8, 100, 4)).toBeGreaterThan(bayesianScore(5, 1, 4));
  });
});

describe('priorMeanOf', () => {
  it('averages rated teas only, and is null with none', () => {
    expect(
      priorMeanOf([
        tea({ avgStars: 4, reviewCount: 1 }),
        tea({ avgStars: 2, reviewCount: 1 }),
        tea(),
      ])
    ).toBe(3);
    expect(priorMeanOf([tea()])).toBeNull();
  });
});

describe('rankTeas', () => {
  it('ranks by weighted score so one rating cannot top the list, and drops thin teas', () => {
    const lucky = tea({ avgStars: 5, reviewCount: 1 });
    const solid = tea({ avgStars: 4.6, reviewCount: 40 });
    const fine = tea({ avgStars: 4.2, reviewCount: 10 });
    const few = tea({ avgStars: 5, reviewCount: 2 });
    const ranked = rankTeas([lucky, few, fine, solid], 4);
    expect(ranked.map((r) => r.tea.id)).toEqual([solid.id, fine.id]);
  });

  it('breaks ties by rating count, then name', () => {
    const a = tea({ name: 'B', avgStars: 4, reviewCount: 5 });
    const b = tea({ name: 'A', avgStars: 4, reviewCount: 5 });
    const c = tea({ name: 'Z', avgStars: 4, reviewCount: 9 });
    expect(rankTeas([a, b, c], 4).map((r) => r.tea.name)).toEqual(['Z', 'A', 'B']);
  });
});
