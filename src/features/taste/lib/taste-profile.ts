import type { ProductCategory } from '@/features/products';
import { TASTE_ATTRIBUTES, type PrepMethod, type TasteAttribute } from '@/features/reviews';

// One tasting, as the journal lists them (newest first).
export interface Tasting {
  product: { id: string; category: ProductCategory };
  stars: number;
  flavorNotes: string[];
  profile: Partial<Record<TasteAttribute, number>>;
  prep: { method: PrepMethod | null };
}

export interface TasteProfile {
  // Distinct teas rated; Vivino calls 5 "a starting point".
  ratedTeas: number;
  early: boolean;
  favouriteNotes: string[];
  // Average sliders on teas rated 4★ or more, and on teas rated 2★ or less.
  liked: Partial<Record<TasteAttribute, number>>;
  disliked: Partial<Record<TasteAttribute, number>>;
  byCategory: Record<ProductCategory, { teas: number; avgStars: number | null }>;
  favouritePrep: PrepMethod | null;
}

const EARLY_BELOW = 5;
const TOP_NOTES = 3;
const LIKED = 4;
const DISLIKED = 2;

function averageSliders(tastings: Tasting[]): Partial<Record<TasteAttribute, number>> {
  const result: Partial<Record<TasteAttribute, number>> = {};
  for (const attribute of TASTE_ATTRIBUTES) {
    const values = tastings
      .map((t) => t.profile[attribute])
      .filter((v): v is number => v !== undefined);
    if (values.length) result[attribute] = values.reduce((s, v) => s + v, 0) / values.length;
  }
  return result;
}

function mostCommon<T>(values: T[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  // Stable sort: ties go to the most recent, since tastings arrive newest first.
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// The taster's own profile, Vivino's "Your taste": built from each tea's latest tasting, so
// re-logging a favourite does not skew it.
export function buildTasteProfile(tastings: Tasting[]): TasteProfile {
  const seen = new Set<string>();
  const latest = tastings.filter((t) => !seen.has(t.product.id) && seen.add(t.product.id));
  const liked = latest.filter((t) => t.stars >= LIKED);
  const disliked = latest.filter((t) => t.stars <= DISLIKED);

  const byCategory = { matcha: { teas: 0, total: 0 }, hojicha: { teas: 0, total: 0 } };
  for (const t of latest) {
    byCategory[t.product.category].teas += 1;
    byCategory[t.product.category].total += t.stars;
  }

  const noteCounts = new Map<string, number>();
  for (const note of liked.flatMap((t) => t.flavorNotes))
    noteCounts.set(note, (noteCounts.get(note) ?? 0) + 1);

  return {
    ratedTeas: latest.length,
    early: latest.length < EARLY_BELOW,
    favouriteNotes: [...noteCounts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_NOTES)
      .map(([note]) => note),
    liked: averageSliders(liked),
    disliked: averageSliders(disliked),
    byCategory: {
      matcha: {
        teas: byCategory.matcha.teas,
        avgStars: byCategory.matcha.teas ? byCategory.matcha.total / byCategory.matcha.teas : null,
      },
      hojicha: {
        teas: byCategory.hojicha.teas,
        avgStars: byCategory.hojicha.teas
          ? byCategory.hojicha.total / byCategory.hojicha.teas
          : null,
      },
    },
    favouritePrep: mostCommon(
      liked.map((t) => t.prep.method).filter((m): m is PrepMethod => m !== null)
    ),
  };
}
