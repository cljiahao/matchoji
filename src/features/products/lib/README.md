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

`price-history` turns `tea_price_history` rows into `PricePoint`s and writes `trendSummary` ("Up 12% since Mar 2026", on price per gram, null below two points).

`value-score` is the value formula: within a category (matcha and hojicha apart), among teas with at least 5 ratings and a price, value score = rating percentile minus price-per-gram percentile (each 0 to 1, ties share a percentile), so it runs from -1 to +1. A tea is "great value" at a score of 0.25 or more with a rating in the category's top half. Categories with fewer than 5 such teas score nothing. `valueScoresFor` maps a list of teas to scores; the `bestvalue` Explore sort ranks by it.
`region-pins.ts` holds `REGION_COORDINATES` (town or area centres, public geography, keyed by the seeded region name) and `regionPins`, which turns region summaries into map pins: the tea count (a warning dot when a supply level is scarce; the supply text lives in the tooltip and accessible name), coloured by the larger category, linking to Explore for the region. A region with no entry has no pin; its card still lists it.

## Contents

- `category-styles.ts`
- `discover-params.test.ts`
- `discover-params.ts`
- `filter-products.test.ts`
- `filter-products.ts`
- `index.ts`
- `price-history.test.ts`
- `price-history.ts`
- `pricing.test.ts`
- `pricing.ts`
- `region-pins.test.ts`
- `region-pins.ts`
- `summarize-regions.test.ts`
- `summarize-regions.ts`
- `supply.test.ts`
- `supply.ts`
- `value-score.test.ts`
- `value-score.ts`

## Parent

[products](../README.md)
