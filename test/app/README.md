# app

## Purpose

Route-level tests for `src/app/`, rendered as async Server Components against a fake
Supabase client: the home page (the following feed, its three shelves, empty shelves and empty catalogue),
Explore (SQL filters including grade and minimum rating, sort, search, paging, the match sort and badges, no-results
and empty states), the regions page (counts, supply levels, both sorts, links), the supply page (national
tiles, prefecture cards, sources, empty state), the sell page (signed out, applying,
pending, rejected with its reason, approved with listings), the admin page (404 for
non-admins, the queue and reports for admins), the account page (signed out and signed in, privacy and blocks), taster profiles (public,
private, unknown), the product page (taste,
facts, photos, community reviews, stock report and shop link, where to buy, awaiting-review and rejected notes, who may rate a pending tea, malformed ids, merged duplicates forwarding, the match summary, review reactions), the journal's signed-out, empty and filled states (with Your taste),
loading routes, the public error boundary, and the OAuth callback's redirect handling.

`seo.test.ts` covers the sitemap and robots rules. `config.test.ts` checks the proxy skips
`/api/health` and the content security policy allows images only from the site, its
Supabase project and Google profile photos. `auth-callback.test.ts` also checks its redirects are never cached.

Tea page tests get an empty `edition_ratings` result by default from `useServer`.

## Contents

- `auth-callback.test.ts`
- `config.test.ts`
- `pages.test.tsx`
- `seo.test.ts`

## Parent

[test](../README.md)
