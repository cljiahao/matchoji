# supply

## Purpose

Phase 4's regional scarcity dashboard: official tea harvest figures per prefecture (tea
fields, raw tea made, and tencha, the leaf matcha is ground from), read from
`tea_production_stats` and shaped for the `/regions/supply` page.

## Contents

- `api/`
- `components/`
- `index.ts`
- `lib/`
- `types.ts`

## Connectivity

`api/` reads Supabase and hands the rows to `lib/`'s `summarizeSupply`; `components/` draws
the trends. The page links each prefecture's regions to Explore through `products`'
`discoverHref`, imported in the route rather than here, so this module depends on no other
feature.

## Parent

[features](../README.md)
