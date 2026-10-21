# journal

## Purpose

A taster's personal record: their own tastings over time and the teas they want to try next.

## Contents

- `api/`
- `components/`
- `hooks/`
- `index.ts`
- `lib/`
- `types.ts`

## Connectivity

`api/` reads the user's reviews (reusing the reviews feature's row mapping) and the `wishlist` table; `lib/` turns entries into stats and month groups; `components/` renders them for `/journal`, plus the want-to-try toggle that `products/[id]` mounts via `hooks/`.

## Parent

[features](../README.md)
