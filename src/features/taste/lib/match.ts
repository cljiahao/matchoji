import type { MatchBand, MatchResult, RatedTea, TeaFeatures } from '../types';

// How much each kind of evidence counts when comparing two teas. Category dominates (a
// matcha drinker's hojicha ratings say little about matcha); taste and notes come next.
const WEIGHTS = { category: 3, grade: 1, region: 1, sliders: 3, notes: 3 } as const;

// Sliders run 1-5, so the largest possible gap is 4.
const SLIDER_RANGE = 4;

function sliderSimilarity(a: TeaFeatures['sliders'], b: TeaFeatures['sliders']): number | null {
  const shared = (Object.keys(a) as (keyof typeof a)[]).filter(
    (k) => a[k] !== undefined && b[k] !== undefined
  );
  if (shared.length === 0) return null;
  const gap = shared.reduce((sum, k) => sum + Math.abs((a[k] ?? 0) - (b[k] ?? 0)), 0);
  return 1 - gap / shared.length / SLIDER_RANGE;
}

function noteSimilarity(a: Record<string, number>, b: Record<string, number>): number | null {
  const norm = (v: Record<string, number>) =>
    Math.sqrt(Object.values(v).reduce((s, n) => s + n * n, 0));
  const na = norm(a);
  const nb = norm(b);
  if (na === 0 || nb === 0) return null;
  const dot = Object.entries(a).reduce((s, [note, n]) => s + n * (b[note] ?? 0), 0);
  return dot / (na * nb);
}

// 0 (nothing alike) to 1 (alike in everything both teas record). Evidence only one tea has
// is left out rather than counted as a difference.
export function teaSimilarity(a: TeaFeatures, b: TeaFeatures): number {
  const parts: [number, number][] = [[WEIGHTS.category, a.category === b.category ? 1 : 0]];
  if (a.grade && b.grade) parts.push([WEIGHTS.grade, a.grade === b.grade ? 1 : 0]);
  if (a.regionId && b.regionId) parts.push([WEIGHTS.region, a.regionId === b.regionId ? 1 : 0]);
  const sliders = sliderSimilarity(a.sliders, b.sliders);
  if (sliders !== null) parts.push([WEIGHTS.sliders, sliders]);
  const notes = noteSimilarity(a.notes, b.notes);
  if (notes !== null) parts.push([WEIGHTS.notes, notes]);

  const weight = parts.reduce((s, [w]) => s + w, 0);
  return parts.reduce((s, [w, v]) => s + w * v, 0) / weight;
}

// Vivino's bands: 70-100 a great match, 40-69 average, under 40 low.
export function matchBand(score: number): MatchBand {
  if (score >= 70) return 'great';
  if (score >= 40) return 'average';
  return 'low';
}

// Ratings of teas less alike than this are noise, not evidence.
const MIN_SIMILARITY = 0.25;
// How many "average ratings" of the taster's own mean pull a thinly supported prediction back.
const PRIOR_WEIGHT = 1;
// The predicted rating maps to "chance of 4★ or more" through a logistic curve centred just
// above 3.5, so a predicted 4★ reads as about 70% and a 5★ as about 95%.
const CENTRE = 3.6;
const STEEPNESS = 2.2;

// Predicts how the taster would rate `candidate` from their ratings of similar teas (a
// similarity-weighted average, shrunk toward their own mean), as Vivino's "Match for You"
// does from the wines you rated. Null when they have rated it already or nothing compares.
export function predictMatch(rated: RatedTea[], candidate: TeaFeatures): MatchResult | null {
  if (rated.length === 0 || rated.some((r) => r.tea.id === candidate.id)) return null;

  const evidence = rated
    .map((r) => ({ ...r, weight: teaSimilarity(r.tea, candidate) ** 2 }))
    .filter((r) => r.weight >= MIN_SIMILARITY ** 2);
  const total = evidence.reduce((s, r) => s + r.weight, 0);
  if (total === 0) return null;

  const mean = rated.reduce((s, r) => s + r.stars, 0) / rated.length;
  const weighted = evidence.reduce((s, r) => s + r.weight * r.stars, 0);
  const predicted = (weighted + PRIOR_WEIGHT * mean) / (total + PRIOR_WEIGHT);

  const score = Math.round(100 / (1 + Math.exp(-(predicted - CENTRE) * STEEPNESS)));
  const because = [...evidence]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map((r) => ({ name: r.tea.name, stars: r.stars }));
  return { score, band: matchBand(score), because };
}
