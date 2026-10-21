# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Vivino-style home page: "Find your next matcha or hojicha", a large search, Matcha and
  Hojicha circles, and shelves of top-rated matcha, top-rated hojicha and newly added teas.
- Explore (`/explore`): the filtered list, with a filter rail (tea, region), sort and wide
  result rows; search from anywhere lands here.
- Product pages in Vivino's order: a tinted hero, "What does it taste like?" (taste sliders
  between two plain words, flavour families with mention counts), facts about the tea, and
  community reviews beside the score, its spread and "Add your rating".
- One-tap rating: tap a star on a product page and the tasting form opens with it set.
- Drawn tea tins stand in for products without a photo.

- Journal (`/journal`): your tastings by month with notes and prep, stats (count,
  average rating, matcha/hojicha split, most-used notes) and a "Want to try" list. A
  "Want to try" toggle on every product page; signed-out visitors sign in first.
- Richer tastings: flavour notes (per-category list, up to 6), a four-attribute taste
  profile (sweetness, umami, bitterness, body), and an optional "How you made it" log
  (method, grams, water, temperature, date tasted). Stars alone still log a tasting.
- Product pages: a large score numeral, rating distribution, average taste profile, the
  most-noticed notes, how people make it, and a strip of review photos — each shown only
  when tastings carry that data.
- Migration `20261021000000_tasting_journal.sql`: the new `reviews` columns and a
  `wishlist` table for "want to try" (used by the journal).
- Discover search (name or brand), region filter and sort (top rated, most reviewed,
  newest), all kept in the URL; a distinct "no teas match" state with a clear-filters link.
- Phase 1 rating and discovery: Google sign-in (Supabase Auth), discover feed with
  matcha/hojicha category tabs, product detail page with reviews, and an inline "Rate it"
  form. The feed's "Log a tasting" dialog searches the catalog or adds a new product.
- Supabase schema migrations: profiles, regions (seeded with the main tea regions),
  products, reviews, the `product_ratings` aggregate view, a review-photo Storage bucket,
  and a `public_profiles` view exposing reviewer display names only.
- Long review notes collapse behind "Read more"; reviews page 10 at a time.
- Loading skeletons for the feed and product pages.
- Product search waits 250ms after typing stops before querying, instead of sending a
  request per keystroke.
- `DESIGN.md` and `.impeccable/design.json` recording the Phase 1 design system.
- Component, page and route tests (React Testing Library + jsdom) with a recording fake
  Supabase client; changed-line coverage is above the CI gate's 80%.

### Changed

- Logging a tasting, rating and saving to "Want to try" now need an account, as on Vivino:
  signed out, each opens a "Join Matchoji" sign-in dialog first. Signed-out ratings and new
  products are no longer kept across sign-in.
- New look: white page, products on warm grey tiles, deep matcha green for actions, pill
  buttons and the Figtree typeface. Reviews are cards with a star score.
- Visual refresh: paper-toned page ground with white cards, a top bar with Discover and Journal links and a global "Log a tasting" button, and product cards with an image well
  (photo or category-tinted leaf), the category badge on the image and a score numeral.
  The category side stripe is gone.
- Supabase clients use the publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
  instead of the legacy anon key, ahead of Supabase retiring legacy keys at the end of 2026. The unused `SUPABASE_SERVICE_ROLE_KEY` is dropped from `.env.example`.
- Harness upgraded to templateCentral 6.0.4: `block-no-verify.sh` judges a bare
  `git commit`/`git push` by the directory the command runs in, so worktree commits are no
  longer blocked by the main checkout's branch.
- Dependencies updated within their semver ranges (Next.js 16.4, React 19.3,
  supabase-js 2.117, Radix 1.8, TanStack Query 5.104, Zod 4.6.7, and tooling).

### Fixed

- The home page renders per request, so a build without Supabase env vars (Vercel Preview)
  no longer fails prerendering `/`.
- Signed-out visitors adding a new product no longer hit "Could not add that product":
  the dialog sends them through Google sign-in first and reopens with the product filled in.

### Security

- The OAuth callback only redirects to same-origin paths (open-redirect fix).
- Product search strips PostgREST filter syntax from user input.
- Reviews show a display name, never the reviewer's email.

### Removed

- Scaffold `/dashboard` route and the scaffold footer's placeholder credit and link.
