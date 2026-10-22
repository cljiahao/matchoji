import { z } from 'zod';

import { buildSearchFilter } from '../api/search-filter';
import type { ProductCategory } from '../types';

export const DISCOVER_SORTS = ['top', 'reviewed', 'newest'] as const;
export type DiscoverSort = (typeof DISCOVER_SORTS)[number];

// Vivino's rating thresholds; a tea qualifies when its average is at or above the value.
export const MIN_RATINGS = [4.5, 4, 3.5, 3] as const;
export type MinRating = (typeof MIN_RATINGS)[number];

export interface DiscoverFilters {
  q?: string;
  category?: ProductCategory;
  regionId?: string;
  grade?: string;
  minRating?: MinRating;
  sort: DiscoverSort;
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

  return filters;
}

// Builds an Explore URL from the current filters plus a change, so every control (tea, region,
// grade, rating, sort) keeps the others. The default sort is left out to keep URLs short.
export function discoverHref(current: DiscoverFilters, patch: Partial<DiscoverFilters>): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.category) params.set('category', next.category);
  if (next.regionId) params.set('region', next.regionId);
  if (next.grade) params.set('grade', next.grade);
  if (next.minRating) params.set('rating', String(next.minRating));
  if (next.sort && next.sort !== 'top') params.set('sort', next.sort);
  const query = params.toString();
  return query ? `/explore?${query}` : '/explore';
}
