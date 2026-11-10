# lib

## Purpose

`city.ts` holds the two cities and `resolveCity` (`?city=` beats the `matchoji-city` cookie, which beats Singapore; unknown values are ignored). `hrefs.ts` builds `/cafes/<slug>`, `/c/<slug>` and re-exports the one `drinkHref` from `reviews`. `slug.ts` validates route params. `format.ts` writes prices in each city's own currency. `labels.ts` has the base, style and serving labels. `pins.ts` turns cafés with coordinates into map pins. `rank.ts` holds the top-list threshold and the ranking comparison.

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

## Parent

[cafes](../README.md)
