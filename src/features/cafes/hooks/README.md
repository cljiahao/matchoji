# hooks

## Purpose

TanStack Query wrappers over `api/`. `useCafeSearch` and `useDrinkSearch` debounce 250ms and report `isSearching` across the debounce window, so "no match" is never shown for a query not yet sent; both key by user because the results include the searcher's own pending items, and the drink search waits for a café. `useCreateCafe`, `useCreateDrink`, `useLogDrinkReview` and `useUpdateDrinkReview` are the writes; the review hooks upload the photo first and remove it again if the review fails, and an edit that replaces a photo removes the old file. `useIsTrustedTaster` is undefined until known, so the rating form never flashes the wrong fields.

## Contents

- `index.ts`
- `use-cafe-search.query.ts`
- `use-create-cafe.mutation.ts`
- `use-create-drink.mutation.ts`
- `use-drink-search.query.ts`
- `use-log-drink-review.mutation.ts`
- `use-trusted-taster.query.ts`
- `use-update-drink-review.mutation.ts`

## Parent

[cafes](../README.md)
