import type { DrinkBase, DrinkStyle } from '@/integrations/supabase/database.types';

import type { CitySlug } from '../types';
import { CITIES, cityBySlug } from './city';

// "Other" has no shared meaning across cafés, so it never gets a list of its own.
export const LIST_STYLES: readonly DrinkStyle[] = ['latte', 'iced_latte', 'straight', 'float'];
export const LIST_BASES: readonly DrinkBase[] = ['hojicha', 'matcha'];

export interface DrinkListKey {
  city: CitySlug;
  base: DrinkBase;
  style: DrinkStyle;
}

const styleSlug = (style: DrinkStyle) => style.replace('_', '-');

// e.g. singapore-hojicha-iced-latte
export const drinkListSlug = ({ city, base, style }: DrinkListKey): string =>
  `${city}-${base}-${styleSlug(style)}`;

// Every list a visitor could be offered, in the order the index shows them.
export const ALL_DRINK_LISTS: readonly DrinkListKey[] = CITIES.flatMap((city) =>
  LIST_BASES.flatMap((base) => LIST_STYLES.map((style) => ({ city: city.slug, base, style })))
);

// A slug that is not one of the known lists is not trusted: it may be an old tea-list slug.
export function parseDrinkListSlug(slug: string): DrinkListKey | undefined {
  return ALL_DRINK_LISTS.find((key) => drinkListSlug(key) === slug);
}

// "Top hojicha lattes in Singapore"; a straight drink has no plural, so it reads "Top straight hojicha".
const TITLE_PHRASE: Record<DrinkStyle, (base: string) => string> = {
  latte: (base) => `${base} lattes`,
  iced_latte: (base) => `${base} iced lattes`,
  straight: (base) => `straight ${base}`,
  float: (base) => `${base} floats`,
  other: (base) => `${base} drinks`,
};

export function drinkListTitle({ city, base, style }: DrinkListKey): string {
  const cityName = cityBySlug(city)?.name ?? city;
  return `Top ${TITLE_PHRASE[style](base)} in ${cityName}`;
}

export const topDrinksHref = (key: DrinkListKey): string => `/top/${drinkListSlug(key)}`;
export const topTeasHref = (slug?: string): string => (slug ? `/top/teas/${slug}` : '/top/teas');
