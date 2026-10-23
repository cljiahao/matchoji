# hooks

## Purpose

TanStack Query hooks wrapping the review/product-search/product-create/region-list Supabase
calls used by `LogTastingDialog`. `useLogReview` uploads the photo, then stores every
tasting field, removing the photo again if the review cannot be saved. `useProductSearch` debounces the query (250ms) and
exposes `isSearching`, which is true through the debounce window as well as the fetch; it
keys results by the signed-in user, since `search_teas` also returns their own teas
awaiting review.

`useUpdateReview` saves an edited tasting: a new photo replaces the old one (whose file is then
removed), and a failed save removes the new upload instead.

## Contents

- `index.ts`
- `use-create-product.mutation.ts`
- `use-log-review.mutation.ts`
- `use-log-review.test.tsx`
- `use-product-search.query.ts`
- `use-regions.query.ts`
- `use-update-review.mutation.ts`
- `use-update-review.test.tsx`

## Parent

[reviews](../README.md)
