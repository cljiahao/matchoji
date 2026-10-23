# products

## Purpose

The product catalog: listing, searching, and creating hojicha/matcha products, plus the
discover-feed UI (cards, category tabs, empty state).

## Contents

- `api/`
- `components/`
- `index.ts`
- `lib/`
- `schemas/`
- `types.ts`

## Connectivity

`types.ts` and `schemas/` define the catalog data and its validation; `api/` reads and
writes it via Supabase; `components/` renders it. `reviews` depends on this module (through
its public `index.ts`) for search and product creation — this module never depends back on
`reviews`.
`lib/` holds `CATEGORY_STYLES`, the single source for jade/amber category classes. `types.ts`'s
`Product` carries `topNotes` (the feed's two most-noticed notes) , `supply` (how scarce
its category is in its region) `shopUrl` (its page on the maker's shop) and `status` (`pending` until an admin approves
a taster-added tea, with `addedBy` naming who suggested it, `reviewNote` the admin's reason and `mergedInto` the tea a
merged duplicate forwards to); `ProductSummary` can carry
`status` where a list may include teas outside the catalogue; `ProductGrid` takes a
`renderAction` slot for per-card controls owned by other features.

## Parent

[features](../README.md)
