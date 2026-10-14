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
`lib/` holds `CATEGORY_STYLES`, the single source for jade/amber category classes.

## Parent

[features](../README.md)
