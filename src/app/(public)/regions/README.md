# regions

## Purpose

`/regions`: every tea region with its prefecture, how many matcha and hojicha teas come from
it, its matcha and hojicha supply levels, and its scarcity note when one is recorded. Regions
with the most teas come first, or the scarcest first with `?sort=scarce`; each card links to
Explore filtered to that region. Rendered per request, since counts are live, from `listRegionSummaries`. The intro links to
`supply/`, the official harvest figures behind the levels.

Titled "Tea regions". Its `loading.tsx` skeleton is announced as a busy `status`.

The sort pills keep a 44px minimum height on phones.

A region card hides its prefecture line when the name already ends with it, and prefixes the supply line with "Supply:".

A map of the regions (`TeaMap`, pins from `regionPins`) sits above the cards: each pin shows the region's tea count, coloured by the larger category, and links to Explore for it; the cards stay below as the keyboard and screen-reader equivalent. A legend line explains the colours. No map shows when no region has coordinates.

## Contents

- `loading.tsx`
- `page.test.tsx`
- `page.tsx`
- `supply/`

## Parent

[(public)](../README.md)
