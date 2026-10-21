# api

## Purpose

Supabase reads (server-safe) and client-side mutations for submitting a review, including
photo upload to Storage. Tested against a recording fake Supabase
client (`test/support/fake-supabase.ts`).

Reviews read and write the tasting profile and preparation columns; `mapReviewRow` and
`REVIEW_COLUMNS` are shared with the journal.

## Contents

- `index.ts`
- `reviews-mutations.test.ts`
- `reviews-mutations.ts`
- `reviews-service.test.ts`
- `reviews-service.ts`

## Parent

[reviews](../README.md)
