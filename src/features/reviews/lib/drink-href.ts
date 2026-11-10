// A drink page lives under its café, so both slugs are needed to link to it.
export function drinkHref(cafeSlug: string, drinkSlug: string): string {
  return `/cafes/${cafeSlug}/${drinkSlug}`;
}
