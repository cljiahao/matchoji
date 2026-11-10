# api

## Purpose

Supabase reads, server-safe, tested against the recording fake client (`test/support/fake-supabase.ts`). Columns are named, never `select('*')`, because `cafes` and `drinks` grant columns individually (`added_by`, `review_note` and `reviewed_at` are not readable). A missing table (`isMissingTable`: 42P01, PGRST205) returns empty instead of throwing.

`listCafes` (a city, optionally one area or taster-reviewed only) and `getCafePage` return approved, un-merged cafés with scores from the `cafe_ratings` and `drink_ratings` views. `getDrinkPage` also reads the drink's reviews through the `drink_reviews` function and splits them into trusted-taster and community reviews. `listTopDrinks` applies the threshold (at least one taster review or three community reviews) and ranks taster-reviewed drinks first, then score, then review count, never recency; `listSimilarDrinks` is the same base and style in the same city. `latestTasterReviews` and `listLatestTasterDrinkReviews` give the newest trusted-taster review per person and drink. `listCafeSitemapEntries` lists approved cafés and drinks. `listCities` returns the two fixed cities.

## Contents

- `cafes-service.test.ts`
- `cafes-service.ts`
- `index.ts`

## Parent

[cafes](../README.md)
