# lib

## Purpose

`CATEGORY_STYLES`: the jade (matcha) / amber (hojicha) Tailwind classes for badges, fills,
tints, stars and the product hero band, so category colour is applied identically
everywhere. `discover-params` turns the Explore URL into validated filters (invalid values
are dropped) and back into `/explore` links via `discoverHref`; `sort-products` implements
the four orders, including "Scarcest first". `supply` ranks the supply levels (scarce,
tight, plentiful, then unknown). The tests' `Product` fixtures carry every field, including
`supply`, `shopUrl`, `status`, `addedBy`, `reviewNote` and `mergedInto`, which these helpers
ignore. `filter-products` applies the grade and minimum-rating filters after the
query and lists the grade options; `summarize-regions` counts each region's matcha and
hojicha for the regions page and `sortRegionsByScarcity` reorders them, scarcest first.

## Contents

- `category-styles.ts`
- `discover-params.test.ts`
- `discover-params.ts`
- `filter-products.test.ts`
- `filter-products.ts`
- `index.ts`
- `sort-products.test.ts`
- `sort-products.ts`
- `summarize-regions.test.ts`
- `summarize-regions.ts`
- `supply.test.ts`
- `supply.ts`

## Parent

[products](../README.md)
