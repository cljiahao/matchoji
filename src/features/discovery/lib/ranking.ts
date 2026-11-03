import type { CatalogueTea } from '@/features/products';

// The same prior as the catalogue_teas view's weighted_score, so Explore's "Top rated" and
// these lists agree: (v·R + m·C) / (v + m).
export const PRIOR_WEIGHT = 5;
// A tea needs this many ratings to be ranked in a list or compared in a highlight.
export const MIN_LIST_RATINGS = 3;
// A list or comparison group needs this many qualifying teas before it says anything.
export const MIN_LIST_TEAS = 5;

export function bayesianScore(avg: number, count: number, priorMean: number): number {
  return (count * avg + PRIOR_WEIGHT * priorMean) / (count + PRIOR_WEIGHT);
}

// The mean of every rated tea's average: the catalogue-wide "C" that thin teas are pulled to.
export function priorMeanOf(catalogue: CatalogueTea[]): number | null {
  const rated = catalogue.flatMap((t) => (t.avgStars === null ? [] : [t.avgStars]));
  if (rated.length === 0) return null;
  return rated.reduce((sum, v) => sum + v, 0) / rated.length;
}

export interface RankedTea {
  tea: CatalogueTea;
  score: number;
}

export const isQualified = (tea: CatalogueTea) =>
  tea.avgStars !== null && tea.reviewCount >= MIN_LIST_RATINGS;

// Qualifying teas, best first by Bayesian score (ties: more ratings, then name).
export function rankTeas(teas: CatalogueTea[], priorMean: number): RankedTea[] {
  return teas
    .filter(isQualified)
    .map((tea) => ({ tea, score: bayesianScore(tea.avgStars ?? 0, tea.reviewCount, priorMean) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.tea.reviewCount - a.tea.reviewCount ||
        a.tea.name.localeCompare(b.tea.name)
    );
}
