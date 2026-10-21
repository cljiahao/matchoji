# lib

## Purpose

Pure helpers for review display and the sign-in drafts: a rating (`review-draft`) or a new
product (`product-draft`) parked in sessionStorage across the OAuth redirect, both built on
`session-draft`, which schema-checks what it reads back, kept separate so they are unit-tested
without rendering.

`tasting-vocab` holds the flavour-note lists, prep methods and taste attributes;
`summarize-reviews` turns a product's reviews into its distribution, average profile, top
notes, typical preparation and photos. `roving-radio` gives button-based radio groups one tab
stop and wrapping arrow-key selection.

## Contents

- `index.ts`
- `local-date.ts`
- `product-draft.test.ts`
- `product-draft.ts`
- `review-draft.test.ts`
- `review-draft.ts`
- `roving-radio.ts`
- `session-draft.ts`
- `summarize-reviews.test.ts`
- `summarize-reviews.ts`
- `tasting-vocab.test.ts`
- `tasting-vocab.ts`
- `truncate-notes.test.ts`
- `truncate-notes.ts`

## Parent

[reviews](../README.md)
