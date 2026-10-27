import { z } from 'zod';

import { buildSearchFilter } from '../api/search-filter';
import type { ProductCategory } from '../types';

// 'match' ranks by the signed-in taster's match score; signed out it falls back to 'top'.
export const DISCOVER_SORTS = ['top', 'reviewed', 'newest', 'scarce', 'value', 'match'] as const;
export type DiscoverSort = (typeof DISCOVER_SORTS)[number];

// Vivino's rating thresholds; a tea qualifies when its average is at or above the value.
export const MIN_RATINGS = [4.5, 4, 3.5, 3] as const;
export type MinRating = (typeof MIN_RATINGS)[number];

// How many teas Explore shows at first, and how many each "Show more" adds.
export const SHOW_MORE_STEP = 12;
// Caps the list a URL can ask for; 500 is also the size of the "Best match" pool.
const MAX_SHOWN = 500;

export interface DiscoverFilters {
  q?: string;
  category?: ProductCategory;
  regionId?: string;
  grade?: string;
  minRating?: MinRating;
  sort: DiscoverSort;
  // How many teas to show, a multiple of SHOW_MORE_STEP above it; absent means the first step.
  shown?: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// URL params are user input: anything that does not validate is dropped rather than
// failing the page, so a hand-edited or stale link still renders the feed.
export function parseDiscoverParams(params: RawParams): DiscoverFilters {
  const filters: DiscoverFilters = { sort: 'top' };

  const q = first(params.q)?.trim();
  if (q && buildSearchFilter(q)) filters.q = q;

  const category = z.enum(['matcha', 'hojicha']).safeParse(first(params.category));
  if (category.success) filters.category = category.data;

  const region = z.uuid().safeParse(first(params.region));
  if (region.success) filters.regionId = region.data;

  // Grade is free text on products, so any value the product form could store is accepted.
  const grade = z.string().trim().min(1).max(60).safeParse(first(params.grade));
  if (grade.success) filters.grade = grade.data;

  const rating = MIN_RATINGS.find((value) => String(value) === first(params.rating));
  if (rating) filters.minRating = rating;

  const sort = z.enum(DISCOVER_SORTS).safeParse(first(params.sort));
  if (sort.success) filters.sort = sort.data;

  // An old `?page=` link has no counterpart here and falls through to the first step.
  const shown = z.coerce
    .number()
    .int()
    .min(SHOW_MORE_STEP * 2)
    .max(MAX_SHOWN)
    .multipleOf(SHOW_MORE_STEP)
    .safeParse(first(params.shown));
  if (shown.success) filters.shown = shown.data;

  return filters;
}

// Builds an Explore URL from the current filters plus a change, so every control (tea, region,
// grade, rating, sort) keeps the others. The default sort is left out to keep URLs short.
// Any change other than `shown` goes back to the first step, since the list it extends has
// changed.
export function discoverHref(current: DiscoverFilters, patch: Partial<DiscoverFilters>): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.category) params.set('category', next.category);
  if (next.regionId) params.set('region', next.regionId);
  if (next.grade) params.set('grade', next.grade);
  if (next.minRating) params.set('rating', String(next.minRating));
  if (next.sort && next.sort !== 'top') params.set('sort', next.sort);
  if (patch.shown && patch.shown > SHOW_MORE_STEP) params.set('shown', String(patch.shown));
  const query = params.toString();
  return query ? `/explore?${query}` : '/explore';
}

// The count line and the "Show more" target for a list of `shown` teas out of `total`;
// `moreHref` is null once every tea is on screen or the URL cap is reached.
export function discoverProgress(
  filters: DiscoverFilters,
  visible: number,
  total: number
): { countLabel: string; moreHref: string | null } {
  const limit = filters.shown ?? SHOW_MORE_STEP;
  const nextLimit = limit + SHOW_MORE_STEP;
  const teaWord = total === 1 ? 'tea' : 'teas';
  const canShowMore = visible < total && nextLimit <= MAX_SHOWN;
  return {
    countLabel: visible === 0 ? 'No teas' : `Showing ${visible} of ${total} ${teaWord}`,
    moreHref: canShowMore ? discoverHref(filters, { shown: nextLimit }) : null,
  };
}
