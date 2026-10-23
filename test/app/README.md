# app

## Purpose

Route-level tests for `src/app/`, rendered as async Server Components against a fake
Supabase client: the home page (its three shelves, empty shelves and empty catalogue),
Explore (filters including grade and minimum rating, sort, search, no-results and empty
states), the regions page (counts, supply levels, both sorts, links), the supply page (national
tiles, prefecture cards, sources, empty state), the sell page (signed out, applying,
pending, approved with listings), the product page (taste,
facts, photos, community reviews, stock report and shop link, where to buy, awaiting-review and rejected notes), the journal's signed-out, empty and filled states,
loading routes, the public error boundary, and the OAuth callback's redirect handling.

## Contents

- `auth-callback.test.ts`
- `pages.test.tsx`

## Parent

[test](../README.md)
