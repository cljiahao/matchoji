# components

## Purpose

Journal UI: the stats strip, the month-grouped timeline (each tasting as a card with its
tea tile), the want-to-try list with remove, and the `WantToTryButton` used on product
pages, shelves and Explore rows. Timeline cards and want-to-try rows show
`CatalogueStatusNote` ("Awaiting review", "Not in the catalogue") next to such teas.

`StashEditor` opens a small panel (how many, opened on) with Save and Cancel; Cancel drops unsaved edits.

Each timeline card has `TastingActions`: Edit (the tasting form, prefilled) and Delete (after a
confirmation; the photo goes too).

Component tests build `Review` objects with every field, including `authorId`.

Want-to-try rows carry `StashEditor`: "I have this", how many and when opened (shown as days
since opening, since matcha fades once opened).

`FreshnessHint` shows on the tea page for a signed-in user whose stash has an opened date: days
open, the maker's own guidance where published, else general advice, and a link to the Learn guide.

## Contents

- `freshness-hint.test.tsx`
- `freshness-hint.tsx`
- `index.ts`
- `journal-stats-strip.tsx`
- `journal-timeline.tsx`
- `stash-editor.test.tsx`
- `stash-editor.tsx`
- `tasting-actions.test.tsx`
- `tasting-actions.tsx`
- `want-to-try-button.test.tsx`
- `want-to-try-button.tsx`
- `wishlist-list.test.tsx`
- `wishlist-list.tsx`

## Parent

[journal](../README.md)
