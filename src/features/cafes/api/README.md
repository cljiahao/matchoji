# api

## Purpose

Supabase reads and writes, server-safe, tested against the recording fake client (`test/support/fake-supabase.ts`). Columns are named, never `select('*')`, because `cafes` and `drinks` grant columns individually (`added_by`, `review_note` and `reviewed_at` are not readable). A missing table (`isMissingTable`: 42P01, PGRST205) returns empty instead of throwing.

`listCafes` (a city, optionally one area or taster-reviewed only) and `getCafePage` return approved, un-merged cafés with scores from the `cafe_ratings` and `drink_ratings` views. `getDrinkPage` also reads the drink's reviews through the `drink_reviews` function and splits them into trusted-taster and community reviews. The top lists read the `drink_ranks` view, which holds each approved drink with its city, base, style, whether it qualifies (at least one taster review or three community reviews) and its rank score. `readRanked` filters it, orders taster-reviewed drinks first, then score, then review count, then name, never recency, and asks for an exact count and one range of ids; the drinks are then hydrated by id in that order. `listTopDrinks` takes the first rows, `listTopDrinkLists` reads the first 3 of each of the 16 city × base × style lists and uses the exact total as its "See all N" count (empty lists left out), `listTopDrinksPage` pages a list (20 a page) with the same total, so `/top/<slug>` and `/top` agree, and `listSimilarDrinks` is the same base and style in the same city, drink excluded, best rated first. No list is built from a capped read, so a cap never drops arbitrary drinks or understates a total. The one ceiling left is `cityDrinks` (1000 drinks, taken after ranking, wrapped in `cache()`), which feeds the latest taster drink reviews. The `drink_reviews` function read is capped at 100 reviews, and `taster_disclosed_count` from `cafe_ratings` feeds the disclosure count. A missing `drink_ranks` view yields empty lists. `latestTasterReviews` and `listLatestTasterDrinkReviews` give the newest trusted-taster review per person and drink, read from the `latest_reviews` view with a limit. A merged café or drink is followed to its final survivor in one redirect (at most 5 hops; a loop or longer chain is missing, a rejected or unreadable final survivor falls back as before). A missing `drink_reviews` function or `public_profiles` view yields no reviews or names rather than an error, and `listCafes` still lists cafés, unscored, when `cafe_ratings` is missing. `listCafeSitemapEntries` lists approved cafés and drinks, reading past PostgREST's 1000-row cap page by page. `listCities` returns the two fixed cities; it is service-only and not exported from the barrel (pages read `lib/city.ts`).

`cafes-search.ts` backs the logging flow: `searchCafes` lists approved cafés plus the searcher's own pending ones (merged duplicates skipped), `searchDrinks` a café's drinks, and `loadIsTrustedTaster` reads the badge from `public_profiles` (false on error). `cafes-mutations.ts` holds the writes, which go through RLS and the database checks: `createCafe`, `createDrink`, `createDrinkReview` and `updateDrinkReview`. Slugs and currency are set by database triggers, and the taster fields are sent as typed because the database stamps and enforces who is a trusted taster. A pending-cap or daily-cap error (`P0001`), a duplicate café (`23505` on `createCafe`) and a duplicate drink (`23505` on `createDrink`) become a `FriendlyError` whose message is meant for the person.

`updateDrinkReview` throws `RowNotChangedError` (from the reviews feature) when no row changed, since row-level security hides a row it refuses rather than raising. `drinkReviewErrorMessage` turns a failed rating save into words for the person: Postgres 42501 (denied) and 23514 (a check refused a value) and a vanished row each get a friendly line, a `FriendlyError` passes through, and anything else is generic.

## Contents

- `cafes-mutations.test.ts`
- `cafes-mutations.ts`
- `cafes-search.test.ts`
- `cafes-search.ts`
- `cafes-service.test.ts`
- `cafes-service.ts`
- `index.ts`

## Parent

[cafes](../README.md)
