# components

## Purpose

Journal UI: the stats strip (teas rated, average, category split, top notes, and, once there are 3 tastings, top maker, top region, usual preparation and this month's tasting days with the longest run), the month-grouped timeline (each tasting as a card with its
tea tile), the want-to-try list with remove, and the `WantToTryButton` used on product
pages, shelves and Explore rows. Timeline cards and want-to-try rows show
`CatalogueStatusNote` ("Awaiting review", "Not in the catalogue") next to such teas.

`PublicStatsStrip` is the counts-only strip on `/u/[id]`. `YearLinks` links the years with 3 or more tastings, `YearInTeaView` is the owner's recap and `YearShareButton` shares the public recap link through the Web Share API, copying it where there is no share sheet.

`StashEditor` opens a small panel (how many, opened on) with Save and Cancel; Cancel drops unsaved edits.

Each timeline card has `TastingActions`: Edit (the tea or drink tasting form, prefilled) and Delete (after a
confirmation; the photo goes too).

Component tests build `Review` objects with every field, including `authorId`.

Want-to-try rows carry `StashEditor`: "I have this", how many and when opened (shown as days
since opening, since matcha fades once opened).

`FreshnessHint` shows on the tea page for a signed-in user whose stash has an opened date: days
open, the maker's own guidance where published, else general advice, and a link to the Learn guide.

The compact want-to-try button extends its hit area to 44px without growing visually.

`WantToTryButton` keeps a 44px minimum height on phones in its labelled form.

`StashEditor` fields and buttons are 44px tall.

`JournalTimeline` renders a drink tasting as a row with the drink, its café, the stars, the disclosure badge, notes and the Instagram link; drink rows carry `TastingActions` too, whose Edit opens the café drink form (`DrinkReviewForm`, prefilled) and whose Delete removes the review and its photo after a confirmation.

## Contents

- `freshness-hint.test.tsx`
- `freshness-hint.tsx`
- `index.ts`
- `journal-stats-strip.tsx`
- `journal-timeline.test.tsx`
- `journal-timeline.tsx`
- `public-stats-strip.tsx`
- `stash-editor.test.tsx`
- `stash-editor.tsx`
- `tasting-actions.test.tsx`
- `tasting-actions.tsx`
- `want-to-try-button.test.tsx`
- `want-to-try-button.tsx`
- `wishlist-list.test.tsx`
- `wishlist-list.tsx`
- `year-in-tea-view.tsx`
- `year-links.tsx`
- `year-share-button.test.tsx`
- `year-share-button.tsx`

## Parent

[journal](../README.md)
