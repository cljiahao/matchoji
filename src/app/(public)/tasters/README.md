# tasters

## Purpose

`/tasters`: the trusted tasters, each with their name (linking to their profile), badge, bio, Instagram link, number of drinks rated and latest drink. With no trusted tasters the page shows one line, "No trusted tasters yet.", rather than an empty grid. Rendered per request, because an admin can grant the badge at any time. `loading.tsx` is its skeleton; the page never calls `notFound()` or `redirect()`, which the loading-boundaries test requires.

`generateMetadata` marks the page `noindex` while there are no tasters; the empty state offers `AddCafeCta`.

## Contents

- `loading.tsx`
- `page.test.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
