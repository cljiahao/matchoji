# journal

## Purpose

A taster's personal record: their own tastings over time, the stats and yearly recap computed from them, and the teas they want to try next. Depends on `reviews`, `products` and `taste` through their `index.ts`.

The journal also holds café drink tastings: `JournalItem` is a tea `JournalEntry` or a `DrinkJournalEntry` (a review plus its `DrinkSummary`). Stats, year-in-tea, the taste profile and public stats count teas only (`teaEntries`).

## Contents

- `api/`
- `components/`
- `hooks/`
- `index.ts`
- `lib/`
- `types.ts`

## Connectivity

`api/` reads the user's reviews (reusing the reviews feature's row mapping) and the `wishlist` table; `lib/` turns entries into stats, month groups and the yearly recap; `components/` renders them for `/journal`, plus the want-to-try toggle that `products/[id]` mounts via `hooks/`.

## Parent

[features](../README.md)
