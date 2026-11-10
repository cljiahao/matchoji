# lib

## Purpose

Pure helpers for review display, kept separate so they are unit-tested without rendering.
`tasting-vocab` holds the flavour-note lists and their families, prep methods, taste
attributes and each attribute's two poles; `summarize-reviews` turns a product's reviews
into its distribution, average profile, note counts, typical preparation and photos.
`roving-radio` gives button-based radio groups one tab stop and wrapping arrow-key
selection; `local-date` and `truncate-notes` format input and display.

`tasting-vocab` also holds the flushes (`FLUSHES`, `FLUSH_LABELS`) and `editionLabel`
("2025 first flush").

`drinkHref(cafeSlug, drinkSlug)` builds a drink page path (`/cafes/<café>/<drink>`), shared by the journal, feed and notifications.

## Contents

- `drink-href.test.ts`
- `drink-href.ts`
- `index.ts`
- `local-date.ts`
- `roving-radio.ts`
- `summarize-reviews.test.ts`
- `summarize-reviews.ts`
- `tasting-vocab.test.ts`
- `tasting-vocab.ts`
- `truncate-notes.test.ts`
- `truncate-notes.ts`

## Parent

[reviews](../README.md)
