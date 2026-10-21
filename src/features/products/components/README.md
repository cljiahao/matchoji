# components

## Purpose

Discover-feed UI: product cards and grid, category badge/tabs, star display, empty state. `products-components.test.tsx` covers them
in jsdom.

Cards lead with `ProductImageWell` (photo, or a category-tinted leaf) and `ScoreNumeral`;
`DiscoverToolbar` holds search, category tabs, region and sort. Cards show up to two
flavour-note chips and take an optional `action` (e.g. the want-to-try toggle), rendered
outside the card link because controls can't nest inside it.

## Contents

- `category-badge.tsx`
- `category-tabs.tsx`
- `discover-toolbar.test.tsx`
- `discover-toolbar.tsx`
- `empty-state.tsx`
- `index.ts`
- `leaf-mark.tsx`
- `product-card.tsx`
- `product-grid.tsx`
- `product-image-well.tsx`
- `products-components.test.tsx`
- `score-numeral.tsx`
- `star-rating-display.tsx`

## Parent

[products](../README.md)
