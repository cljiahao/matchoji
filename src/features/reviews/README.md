# reviews

## Purpose

Rating a product: the star input, review list/item display, photo upload, and the combined
search-or-create-then-rate dialog that drives the whole flow.

`types.ts`'s `Review` carries `authorId` (null once the author deleted their account) so names
can link to profiles, and `edition` (harvest year and flush, tea's vintage).

## Contents

- `api/`
- `components/`
- `hooks/`
- `index.ts`
- `lib/`
- `schemas/`
- `types.ts`

## Connectivity

`schemas/` and `types.ts` define review data; `api/` reads/writes it (plus Storage for
photos); `hooks/` wraps `api/` and `products`' API in TanStack Query; `components/`
(`LogTastingDialog` above all) composes both into the end-to-end rating flow. `lib/` holds
the tasting vocabulary, review summaries, sign-in drafts and display helpers. `types.ts`'s
`Review` carries flavour notes, a taste profile, preparation and the tasting date.

## Parent

[features](../README.md)
