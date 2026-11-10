import { drinkHref } from '@/features/reviews';

import type { CitySlug } from '../types';

// Re-exported so there is one drinkHref: reviews owns it because it cannot import cafes.
export { drinkHref };

export const cafeHref = (slug: string): string => `/cafes/${slug}`;

// Short enough for an Instagram bio; /c/<slug> forwards to the café page.
export const shortCafeHref = (slug: string): string => `/c/${slug}`;

// The page for one city. The city is a cookie as well as a query, so the same path serves either;
// canonicals and the sitemap name the query form so each city's page is its own indexable URL.
export const cityHref = (path: string, city: CitySlug): string => `${path}?city=${city}`;
