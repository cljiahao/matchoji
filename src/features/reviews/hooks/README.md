# hooks

## Purpose

TanStack Query hooks wrapping the review/product-search/product-create/region-list Supabase
calls used by `LogTastingDialog`. `useProductSearch` debounces the query (250ms) and
exposes `isSearching`, which is true through the debounce window as well as the fetch.

## Contents

- `index.ts`
- `use-create-product.mutation.ts`
- `use-log-review.mutation.ts`
- `use-product-search.query.ts`
- `use-regions.query.ts`

## Parent

[reviews](../README.md)
