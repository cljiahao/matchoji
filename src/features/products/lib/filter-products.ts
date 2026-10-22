import type { Product } from '../types';

import type { DiscoverFilters } from './discover-params';

const normalize = (grade: string) => grade.trim().toLowerCase();

// Grade is typed by whoever added the tea, so "Ceremonial" and "ceremonial " are one option.
// The first spelling seen is the one shown.
export function gradeOptions(products: Product[]): string[] {
  const byKey = new Map<string, string>();
  for (const { grade } of products) {
    if (grade?.trim() && !byKey.has(normalize(grade))) byKey.set(normalize(grade), grade.trim());
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

// Grade and rating are applied after the query, on the products it returned: both are cheap
// over a catalogue this size, and the grade options have to come from the unfiltered list.
export function filterByFacets(products: Product[], filters: DiscoverFilters): Product[] {
  const grade = filters.grade && normalize(filters.grade);
  const { minRating } = filters;
  return products.filter(
    (p) =>
      (!grade || (p.grade !== null && normalize(p.grade) === grade)) &&
      (!minRating || (p.avgStars !== null && p.avgStars >= minRating))
  );
}
