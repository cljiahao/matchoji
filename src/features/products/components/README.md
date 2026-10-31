# components

## Purpose

Product UI shared by home, Explore, product pages and the journal. `ProductImageWell` puts a
tea on a warm grey tile: its photo, or a `TeaTin` drawn in the category's colours.
`ProductCard` is the shelf card (brand, name, `RatingInline`) that `ProductShelf` lays out
in a sideways-scrolling row; `ProductRow` is an Explore result with the big `ScoreNumeral` and an optional per-viewer
`badge` (the match score).
`CategoryCircles` open Explore per tea; `ExploreFilters` (links for tea, rating, grade and
region), `ExploreSort` (top rated, most rated, newest, scarcest first) and `SearchPill` drive the Explore URL, and `FilterDisclosure` folds
the rail behind a "Filters" button below `lg`; `ProductFacts` is the product page's facts table; `ScoreNumeral` reads "out of 5" to screen readers. `CatalogueStatusNote` labels a tea
awaiting review or no longer in the catalogue in lists that can include one. Cards
and rows take an optional `action` (the want-to-try toggle), kept outside the link because
controls can't nest inside it. `products-components.test.tsx` builds full `Product`
objects, so a new `Product` field (most recently `price`) is added to its fixtures too. `PriceInline`
("S$0.80/g · Mid-range") sits on cards and rows of priced teas, and `ProductFacts` adds a Price row:
pack price and size, price per gram, cost per cup and the band within the tea's category.

Explore filter options are 44px tall on phones, and tea images load lazily. The explore filter's unselected radio marker uses the `input` border token (3:1).

## Contents

- `category-badge.tsx`
- `catalogue-status-note.tsx`
- `category-circles.tsx`
- `explore-filters.tsx`
- `explore-sort.tsx`
- `filter-disclosure.tsx`
- `index.ts`
- `price-inline.tsx`
- `product-card.tsx`
- `product-facts.tsx`
- `product-grid.tsx`
- `product-image-well.tsx`
- `product-row.tsx`
- `product-shelf.tsx`
- `products-components.test.tsx`
- `rating-inline.tsx`
- `score-numeral.tsx`
- `search-pill.tsx`
- `star-rating-display.tsx`
- `tea-tin.tsx`

## Parent

[products](../README.md)
