# hooks

## Purpose

TanStack Query hooks wrapping the review/product-search/product-create/region-list Supabase
calls used by `LogTastingDialog`. `useLogReview` uploads the photo, then stores every
tasting field. `useProductSearch` debounces the query (250ms) and
exposes `isSearching`, which is true through the debounce window as well as the fetch; it
passes the signed-in user's id so their own teas awaiting review are found too.

## Contents

- `index.ts`
- `use-create-product.mutation.ts`
- `use-log-review.mutation.ts`
- `use-product-search.query.ts`
- `use-regions.query.ts`

## Parent

[reviews](../README.md)
