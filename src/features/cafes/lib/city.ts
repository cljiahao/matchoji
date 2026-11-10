import { z } from 'zod';

import type { City, CitySlug } from '../types';

export const CITY_COOKIE = 'matchoji-city';
export const DEFAULT_CITY: CitySlug = 'singapore';

// The two seeded cities. They are fixed in code as well as seeded in the database so the city
// switch and currency need no round trip.
export const CITIES: readonly City[] = [
  { slug: 'singapore', name: 'Singapore', country: 'SG', currency: 'SGD' },
  { slug: 'johor-bahru', name: 'Johor Bahru', country: 'MY', currency: 'MYR' },
];

export const CitySlugSchema = z.enum(['singapore', 'johor-bahru']);

// ?city= beats the cookie, which beats the default; a value that is not a known city is ignored
// rather than trusted, since both come from the visitor.
export function resolveCity(query: string | undefined, cookie: string | undefined): CitySlug {
  const fromQuery = CitySlugSchema.safeParse(query);
  if (fromQuery.success) return fromQuery.data;
  const fromCookie = CitySlugSchema.safeParse(cookie);
  return fromCookie.success ? fromCookie.data : DEFAULT_CITY;
}

export function cityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
