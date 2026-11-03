import type { ProductCategory } from '@/integrations/supabase/database.types';

import type { Product } from '../types';

// A tea needs this many ratings before its average is trusted enough to judge its value.
export const MIN_VALUE_RATINGS = 5;
// Percentiles within a category of fewer teas than this say nothing, so no tea is scored.
export const MIN_VALUE_POOL = 5;
// "Great value" needs a clear lead over price, not a rounding-error one, and a rating at or
// above the category's middle (a cheap, poor tea is not good value).
export const GREAT_VALUE_SCORE = 0.25;
const GREAT_VALUE_MIN_RATING_PERCENTILE = 0.5;

export interface ValueInput {
  id: string;
  category: ProductCategory;
  avgStars: number | null;
  reviewCount: number;
  // Reference price per gram in SGD; null until priced.
  perGram: number | null;
}

export interface ValueScore {
  // Rating percentile minus price-per-gram percentile, from -1 (dear and poorly rated) to +1.
  score: number;
  ratingPercentile: number;
  pricePercentile: number;
  great: boolean;
}

// Where `value` sits among `all` (which includes it) from 0 (lowest) to 1 (highest); ties
// share the middle of their span so equal teas get equal percentiles.
export function percentile(value: number, all: number[]): number {
  if (all.length < 2) return 0.5;
  const below = all.filter((v) => v < value).length;
  const equal = all.filter((v) => v === value).length;
  return (below + (equal - 1) / 2) / (all.length - 1);
}

// Value = how good a tea is for what it costs, relative to its own category (matcha and
// hojicha are scored apart). Among teas with at least MIN_VALUE_RATINGS ratings and a price:
// value score = rating percentile - price-per-gram percentile. A tea in the top half for
// rating and 25 points or more cheaper (by percentile) than it is good is "great value".
export function computeValueScores(teas: ValueInput[]): Map<string, ValueScore> {
  const result = new Map<string, ValueScore>();
  for (const category of ['matcha', 'hojicha'] as const) {
    const pool = teas.filter(
      (t): t is ValueInput & { avgStars: number; perGram: number } =>
        t.category === category &&
        t.avgStars !== null &&
        t.perGram !== null &&
        t.reviewCount >= MIN_VALUE_RATINGS
    );
    if (pool.length < MIN_VALUE_POOL) continue;
    const ratings = pool.map((t) => t.avgStars);
    const prices = pool.map((t) => t.perGram);
    for (const tea of pool) {
      const ratingPercentile = percentile(tea.avgStars, ratings);
      const pricePercentile = percentile(tea.perGram, prices);
      const score = ratingPercentile - pricePercentile;
      result.set(tea.id, {
        score,
        ratingPercentile,
        pricePercentile,
        great: score >= GREAT_VALUE_SCORE && ratingPercentile >= GREAT_VALUE_MIN_RATING_PERCENTILE,
      });
    }
  }
  return result;
}

export function valueScoresFor(teas: Product[]): Map<string, ValueScore> {
  return computeValueScores(
    teas.map((t) => ({
      id: t.id,
      category: t.category,
      avgStars: t.avgStars,
      reviewCount: t.reviewCount,
      perGram: t.price?.perGram ?? null,
    }))
  );
}
