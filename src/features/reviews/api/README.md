# api

## Purpose

Supabase reads (server-safe) and client-side mutations for submitting a review, including
photo upload to Storage. Tested against a recording fake Supabase
client (`test/support/fake-supabase.ts`).

Reviews read and write the tasting profile and preparation columns; `mapReviewRow` and
`REVIEW_COLUMNS` are shared with the journal (`features/journal`). Reviewer names are looked
up through `selectIn`, so a product with many reviewers never builds an over-long URL.

`listReviews` reads `latest_reviews` (each person's newest tasting of the tea), so the list,
distribution and taste summary agree with the score; a failed name lookup throws instead of
showing "Anonymous". Photos are stored under a random name with the file's extension, and
`removeReviewPhoto` deletes one whose review failed to save. `createReview` always sends the
taster's local date. `updateReview` and `deleteReview` (which also removes the photo) edit the
author's own tasting; `reviewPhotoPath` reads a photo's storage path from its URL. Ratings of a
deleted account show as "Former taster".

## Contents

- `index.ts`
- `review-edits.test.ts`
- `reviews-mutations.test.ts`
- `reviews-mutations.ts`
- `reviews-service.test.ts`
- `reviews-service.ts`

## Parent

[reviews](../README.md)
