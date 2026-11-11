# app

## Purpose

Route-level tests for `src/app/`, rendered as async Server Components against a fake
Supabase client: the home page's per-request render,
Explore (SQL filters including grade and minimum rating, sort, search, "Show more" and the shown count, the match sort and badges, no-results
and empty states), the regions page (counts, supply levels, both sorts, links), the supply page (national
tiles, prefecture cards, sources, empty state), the sell page (signed out, applying,
pending, rejected with its reason, approved with listings), the admin page (404 for
non-admins, the tabs including Cafés and Tasters, queue and reports for admins), the account page (signed out and signed in, privacy and blocks), taster profiles (public,
private, unknown, and their stats strip: shown to visitors of a public profile and to the owner, never read for a visitor of a private one), the product page (taste,
facts, photos, community reviews, stock report and shop link, where to buy, awaiting-review and rejected notes, who may rate a pending tea, malformed ids, merged duplicates forwarding, the match summary, review reactions, a priced tea's price row, the freshness hint for an opened tea), the journal's signed-out, empty and filled states (with the stats strip's tasting count and Your taste),
loading routes, the public error boundary, and the OAuth callback's redirect handling.

`seo.test.ts` queues a `drink_ranks` result per top list for the sitemap, which includes a drink list only once it has a qualifying drink.

`seo.test.ts` covers the sitemap (browse, `/top`, `/top/teas`, `/cafes`, approved café and drink pages, Learn, course and tea pages, a tea list only once enough teas are rated and a drink list only once a drink qualifies) and robots rules. `learn.test.tsx`
covers the Learn index (courses, recipes, guides), course and lesson pages (outline, practice,
previous/next, the done button, 404s), recipe pages (brew numbers, steps, tips, the pre-filled log button's
sign-in prompt, 404s) and guide pages. `config.test.ts` checks the proxy skips
`/api/health` and the Sentry tunnel `/monitoring`, that it sets a fresh nonce-based content security policy on each request (scripts, framing and the other directives), and that `next.config.ts` leaves the CSP to it but keeps `X-Frame-Options` and serves `/sw.js` uncached with `Service-Worker-Allowed`, that the CSP allows same-origin workers, and that the matcher lets `/sw.js` through but stamps `/offline`. `auth-callback.test.ts` also checks its redirects are never cached and ignore a spoofed forwarded host.

Tea page tests get an empty `edition_ratings` result by default from `useServer`.

The tea page tests cover the photo credit caption; the footer's links and photo takedown link are tested with the footer in `src/components/layout`.

The product page test expects no second "Add your rating" card on an unreviewed tea.

The page, config and SEO tests cover the shop map's footprint: the footer's `/shops` link, the sitemap entry, the tile host in the CSP, and the tea page's in-person link, shown only when the maker has a listed shop.

`loading-boundaries.test.ts` fails when a `loading.tsx` sits above a page or layout that calls `notFound()`, `redirect()` or `permanentRedirect()`, because the skeleton would stream the response as a 200. A layout is only covered by a `loading.tsx` in a parent folder. The check walks the TypeScript syntax tree, so comments and strings that mention those calls never count.

`pages.test.tsx` mocks `MARKETPLACE_ENABLED` (off by default, as shipped): the sell page suite and the tea page's "Where to buy" test switch it on, and a tea nobody sells shows no seller or stock prompts to a visitor. Explore's grade test feeds grades with their category. The footer test expects no Sell link at all.

`seo.test.ts` also holds `robots.ts` (admin, account, journal, sell, auth and `/api/` kept out).

`seo.test.ts` also expects `/tasters` and `/about/how-we-rate` in the sitemap.

## Contents

- `auth-callback.test.ts`
- `config.test.ts`
- `learn.test.tsx`
- `loading-boundaries.test.ts`
- `pages.test.tsx`
- `seo.test.ts`

`pages.test.tsx` and `seo.test.ts` also cover the public error boundary's `reset` prop and the sitemap's per-city URLs and omission of empty indexes.

## Parent

[test](../README.md)
