# lib

## Purpose

`CATEGORY_STYLES`: the jade (matcha) / amber (hojicha) Tailwind classes for badges, fills,
tints, stars and the product hero band, so category colour is applied identically
everywhere. `discover-params` turns the Explore URL into validated filters (invalid values
are dropped; `shown` is a multiple of 12 from 24 to 492, and an old `page` is ignored; the sorts include `match`, which Explore ranks per taster) and back into `/explore` links via `discoverHref` (any change but `shown` resets it to 12) and `discoverProgress` (the "Showing X of Y teas" line and the "Show more" link); the sorts now run in SQL (see `api`); `filter-products`'s `gradeOptions` dedupes grades
for the filter rail. `supply` ranks the supply levels (scarce,
tight, plentiful, then unknown). The tests' `Product` fixtures carry every field, including
`supply`, `imageCredit`, `shopUrl`, `status`, `addedBy`, `reviewNote` and `mergedInto`, which these helpers
ignore. `filter-products` applies the grade and minimum-rating filters after the
query and lists the grade options; `summarize-regions` counts each region's matcha and
hojicha for the regions page and `sortRegionsByScarcity` reorders them, scarcest first. `pricing` maps a
tea's reference price (`toTeaPrice`: pack price in SGD, pack size, price per gram, band), formats
it, and holds `CUP_DOSES` (usucha 2 g, koicha 4 g, a hojicha cup 3 g, as in the Learn recipes) and
the band labels; `discover-params` includes the `value` sort (lowest price per gram).

## Contents

- `category-styles.ts`
- `discover-params.test.ts`
- `discover-params.ts`
- `filter-products.test.ts`
- `filter-products.ts`
- `index.ts`
- `pricing.test.ts`
- `pricing.ts`
- `summarize-regions.test.ts`
- `summarize-regions.ts`
- `supply.test.ts`
- `supply.ts`

## Parent

[products](../README.md)
