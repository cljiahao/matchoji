# api

## Purpose

Supabase reads (server-safe) and client-side mutations for submitting a review, including
photo upload to Storage. Tested against a recording fake Supabase
client (`test/support/fake-supabase.ts`).

Reviews read and write the tasting profile and preparation columns; `mapReviewRow` and
`REVIEW_COLUMNS` are shared with the journal (`features/journal`). Reviewer names are looked
up through `selectIn`, so a product with many reviewers never builds an over-long URL.

`listReviews` calls `product_reviews()` (each person's newest tasting of the tea, a private
taster's shown as "Private taster" with no profile link or photo), so the list,
distribution and taste summary agree with the score; a failed name lookup throws instead of
showing "Anonymous". Photos are stored under a random name with the file's extension, and
`removeReviewPhoto` deletes one whose review failed to save. `createReview` always sends the
taster's local date. `updateReview` and `deleteReview` (which also removes the photo) edit the
author's own tasting; `reviewPhotoPath` reads a photo's storage path from its URL. Ratings of a
deleted account show as "Former taster". Each `Review` carries `authorId` for profile links and its `edition`. `listEditions` reads a
tea's ratings per harvest from `edition_ratings`.

`REVIEW_COLUMNS` and `mapReviewRow` also read the drink-review columns; `mapReviewRow` accepts rows from `product_reviews()`, which omits them, and defaults them to a plain tea review. `loadDrinkSummaries` (`drink-summaries.ts`) turns drink ids into `DrinkSummary`s (name, slug, base, and the café's name and slug) for the journal, feed and notifications. It names its columns because `cafes` and `drinks` grant columns individually, omits drinks row-level security hides, and returns an empty map before the café migration is applied.

`updateReview` and `deleteReview` ask for the affected rows back and throw `RowNotChangedError` when there are none, so an RLS-blocked or missing row is not reported as success. `removeReviewPhoto` logs a failed storage removal rather than ignoring it.

## Contents

- `drink-summaries.test.ts`
- `drink-summaries.ts`
- `index.ts`
- `review-edits.test.ts`
- `reviews-mutations.test.ts`
- `reviews-mutations.ts`
- `reviews-service.test.ts`
- `reviews-service.ts`

## Parent

[reviews](../README.md)
