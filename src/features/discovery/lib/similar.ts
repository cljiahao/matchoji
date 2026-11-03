import { tasteCloseness, type TeaFeatures } from '@/features/taste';

export const MAX_SIMILAR = 8;

export interface SimilarCandidate {
  id: string;
  features: TeaFeatures;
  reviewCount: number;
  name: string;
}

// Teas like `target`, nearest first: same category only, then those sharing its grade, then
// its region, then closest in community taste (sliders and notes; teas with no taste data
// rank after those with it), then the better-known, then by name. Needs no ratings: with
// none it falls back to category, grade and region. The target itself is never included.
export function rankSimilar(
  target: TeaFeatures,
  candidates: SimilarCandidate[],
  limit = MAX_SIMILAR
): SimilarCandidate[] {
  const keyed = candidates
    .filter((c) => c.id !== target.id && c.features.category === target.category)
    .map((c) => ({
      c,
      grade: target.grade !== null && c.features.grade === target.grade ? 1 : 0,
      region: target.regionId !== null && c.features.regionId === target.regionId ? 1 : 0,
      taste: tasteCloseness(target, c.features) ?? -1,
    }));
  return keyed
    .sort(
      (a, b) =>
        b.grade - a.grade ||
        b.region - a.region ||
        b.taste - a.taste ||
        b.c.reviewCount - a.c.reviewCount ||
        a.c.name.localeCompare(b.c.name)
    )
    .slice(0, limit)
    .map((k) => k.c);
}
