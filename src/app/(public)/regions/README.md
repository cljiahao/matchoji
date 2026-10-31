# regions

## Purpose

`/regions`: every tea region with its prefecture, how many matcha and hojicha teas come from
it, its matcha and hojicha supply levels, and its scarcity note when one is recorded. Regions
with the most teas come first, or the scarcest first with `?sort=scarce`; each card links to
Explore filtered to that region. Rendered per request, since counts are live, from `listRegionSummaries`. The intro links to
`supply/`, the official harvest figures behind the levels.

Titled "Tea regions". Its `loading.tsx` skeleton is announced as a busy `status`.

## Contents

- `loading.tsx`
- `page.tsx`
- `supply/`

## Parent

[(public)](../README.md)
