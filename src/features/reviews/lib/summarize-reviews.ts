import type { Review } from '../types';
import { TASTE_ATTRIBUTES, type PrepMethod, type TasteAttribute } from './tasting-vocab';

export type StarCount = 1 | 2 | 3 | 4 | 5;

export interface ReviewSummary {
  distribution: Record<StarCount, number>;
  profile: { averages: Partial<Record<TasteAttribute, number>>; contributors: number } | null;
  topNotes: { note: string; count: number }[];
  prep: {
    method: PrepMethod;
    doseG: number | null;
    waterMl: number | null;
    waterTempC: number | null;
  } | null;
  photos: string[];
}

const TOP_NOTES = 6;

// A single taster's numbers are an anecdote, not "how people make it".
const MIN_PREP_VALUES = 2;

function median(values: number[]): number | null {
  if (values.length < MIN_PREP_VALUES) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mode<T>(values: T[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

function summarizeProfile(reviews: Review[]): ReviewSummary['profile'] {
  const withProfile = reviews.filter((r) => Object.keys(r.profile).length > 0);
  if (withProfile.length === 0) return null;
  const averages: Partial<Record<TasteAttribute, number>> = {};
  for (const attribute of TASTE_ATTRIBUTES) {
    const values = withProfile.flatMap((r) => r.profile[attribute] ?? []);
    if (values.length) averages[attribute] = values.reduce((a, b) => a + b, 0) / values.length;
  }
  return { averages, contributors: withProfile.length };
}

function summarizeNotes(reviews: Review[]): ReviewSummary['topNotes'] {
  // Map keeps insertion order, and Array.prototype.sort is stable, so ties keep first appearance.
  const counts = new Map<string, number>();
  for (const note of reviews.flatMap((r) => r.flavorNotes)) {
    counts.set(note, (counts.get(note) ?? 0) + 1);
  }
  return [...counts]
    .map(([note, count]) => ({ note, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_NOTES);
}

// Numbers are taken from reviews using the most common method, so a latte's milk volume
// never skews an usucha's water.
function summarizePrep(reviews: Review[]): ReviewSummary['prep'] {
  const method = mode(reviews.flatMap((r) => (r.prep.method ? [r.prep.method] : [])));
  if (!method) return null;
  const same = reviews.filter((r) => r.prep.method === method).map((r) => r.prep);
  const pick = (key: 'doseG' | 'waterMl' | 'waterTempC') =>
    median(same.flatMap((p) => (p[key] === null ? [] : [p[key]])));
  return { method, doseG: pick('doseG'), waterMl: pick('waterMl'), waterTempC: pick('waterTempC') };
}

export function summarizeReviews(reviews: Review[]): ReviewSummary {
  const distribution: Record<StarCount, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) distribution[r.stars as StarCount] += 1;

  return {
    distribution,
    profile: summarizeProfile(reviews),
    topNotes: summarizeNotes(reviews),
    prep: summarizePrep(reviews),
    photos: reviews.flatMap((r) => (r.photoUrl ? [r.photoUrl] : [])),
  };
}
