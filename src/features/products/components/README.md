# components

## Purpose

Product UI shared by home, Explore, product pages and the journal. `ProductImageWell` puts a
tea on a warm grey tile: its photo, or a `TeaTin` drawn in the category's colours.
`ProductCard` is the shelf card (brand, name, `RatingInline`) that `ProductShelf` lays out
in a sideways-scrolling row; `ProductRow` is an Explore result with the big `ScoreNumeral`.
`CategoryCircles` open Explore per tea; `ExploreFilters` (links), `ExploreSort` and
`SearchPill` drive the Explore URL; `ProductFacts` is the product page's facts table. Cards
and rows take an optional `action` (the want-to-try toggle), kept outside the link because
controls can't nest inside it.

## Contents

- `category-badge.tsx`
- `category-circles.tsx`
- `empty-state.tsx`
- `explore-filters.tsx`
- `explore-sort.tsx`
- `index.ts`
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
