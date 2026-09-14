# reviews

## Purpose

Rating a product: the star input, review list/item display, photo upload, and the combined
search-or-create-then-rate dialog that drives the whole flow.

## Contents

- `api/`
- `components/`
- `hooks/`
- `index.ts`
- `schemas/`
- `types.ts`

## Connectivity

`schemas/` and `types.ts` define review data; `api/` reads/writes it (plus Storage for
photos); `hooks/` wraps `api/` and `products`' API in TanStack Query; `components/`
(`LogTastingDialog` above all) composes both into the end-to-end rating flow.

## Parent

[features](../README.md)
