import { drinkHref } from '@/features/reviews';

// Re-exported so there is one drinkHref: reviews owns it because it cannot import cafes.
export { drinkHref };

export const cafeHref = (slug: string): string => `/cafes/${slug}`;

// Short enough for an Instagram bio; /c/<slug> forwards to the café page.
export const shortCafeHref = (slug: string): string => `/c/${slug}`;
