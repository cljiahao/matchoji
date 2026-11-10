# lib

## Purpose

`city.ts` holds the two cities and `resolveCity` (`?city=` beats the `matchoji-city` cookie, which beats Singapore; unknown values are ignored). `hrefs.ts` builds `/cafes/<slug>` and re-exports the one `drinkHref` from `reviews`. `slug.ts` validates route params. `format.ts` writes prices in each city's own currency. `labels.ts` has the base, style and serving labels. `pins.ts` turns cafés with coordinates into map pins. `rank.ts` holds the top-list threshold and the ranking comparison. `top-lists.ts` names the drink top lists (city × base × style, e.g. `singapore-hojicha-latte`), parses their slugs, titles them and builds `/top` hrefs for drinks and teas.

`cityHref(path, city)` builds the `?city=` URL used for canonicals and the sitemap.

## Contents

- `city.test.ts`
- `city.ts`
- `format.test.ts`
- `format.ts`
- `hrefs.test.ts`
- `hrefs.ts`
- `index.ts`
- `labels.ts`
- `pins.ts`
- `rank.ts`
- `slug.ts`
- `top-lists.test.ts`
- `top-lists.ts`

## Parent

[cafes](../README.md)
