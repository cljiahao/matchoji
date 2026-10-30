# app

## Purpose

Route-level tests for `src/app/`, rendered as async Server Components against a fake
Supabase client: the home page (the following feed, its three shelves, empty shelves and empty catalogue),
Explore (SQL filters including grade and minimum rating, sort, search, "Show more" and the shown count, the match sort and badges, no-results
and empty states), the regions page (counts, supply levels, both sorts, links), the supply page (national
tiles, prefecture cards, sources, empty state), the sell page (signed out, applying,
pending, rejected with its reason, approved with listings), the admin page (404 for
non-admins, the tabs, queue and reports for admins), the account page (signed out and signed in, privacy and blocks), taster profiles (public,
private, unknown), the product page (taste,
facts, photos, community reviews, stock report and shop link, where to buy, awaiting-review and rejected notes, who may rate a pending tea, malformed ids, merged duplicates forwarding, the match summary, review reactions, a priced tea's price row, the freshness hint for an opened tea), the journal's signed-out, empty and filled states (with Your taste),
loading routes, the public error boundary, and the OAuth callback's redirect handling.

`seo.test.ts` covers the sitemap (browse, Learn, course and tea pages) and robots rules. `learn.test.tsx`
covers the Learn index (courses, recipes, guides), course and lesson pages (outline, practice,
previous/next, the done button, 404s), recipe pages (brew numbers, steps, tips, the pre-filled log button's
sign-in prompt, 404s) and guide pages. `config.test.ts` checks the proxy skips
`/api/health`, that it sets a fresh nonce-based content security policy on each request (scripts, framing and the other directives), and that `next.config.ts` leaves the CSP to it but keeps `X-Frame-Options`. `auth-callback.test.ts` also checks its redirects are never cached and ignore a spoofed forwarded host.

Tea page tests get an empty `edition_ratings` result by default from `useServer`.

The tea page tests cover the photo credit caption; the footer's links and photo takedown link are tested with the footer in `src/components/layout`.

## Contents

- `auth-callback.test.ts`
- `config.test.ts`
- `learn.test.tsx`
- `pages.test.tsx`
- `seo.test.ts`

## Parent

[test](../README.md)
