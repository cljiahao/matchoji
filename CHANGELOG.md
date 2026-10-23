# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Security

- Profiles can no longer be edited or deleted through the public profile view (closed by hand
  on 2026-10-24 and now recorded in a migration); users can change only their display name,
  and default names no longer use part of the email.
- Ratings, want-to-try, stock reports and listings attach only to teas in the catalogue (a
  taster may still rate the tea they added while it awaits review). Review photos must be the
  author's own upload, at most 5 MB, and the photo bucket can no longer be listed.

### Fixed

- A tea's score, rating spread, taste summary and flavour notes count each person's latest
  tasting, so logging a tea repeatedly no longer moves them; the journal keeps every tasting.
- The same tea cannot be added twice; "Log a tasting" says so and points to search.
- A tea that is later rejected stays in the journal and want-to-try list of everyone who
  tasted or saved it, labelled "Not in the catalogue"; teas awaiting review are labelled too.
- Teas outside the catalogue no longer show "Where to buy" or stock reports, and only the
  person who added a tea awaiting review can rate it.
- A failed rating or reviewer-name lookup shows the error page instead of "Not yet rated" or
  "Anonymous"; a malformed tea link shows "not found".
- Tastings logged without a date use the taster's local day, not the server's; a photo whose
  tasting failed to save is removed, and stored photo names no longer include the original
  file name.

### Added

- Teas added while logging a tasting now await review, like Vivino's "processing" label on
  an unmatched scan: the taster can rate it and see it in their journal at once, its page
  says "Awaiting review", and it joins Explore, the home shelves, search and the region
  counts once an admin approves it. A rejected tea is visible only to whoever added it.
- Sell on Matchoji (`/sell`, linked from the footer): farms, roasters and tea shops apply to
  sell, are approved by hand, then list catalogue teas with a price, currency, stock and a
  link to buy on their own site. Each tea's page gains "Where to buy" with approved vendors'
  offers, in-stock and cheapest first, or an invitation to sell it.
- Stock at the official shop: each tea's page shows the latest community report ("Sold out ·
  reported 2 days ago"; reports older than two weeks are dropped), a link to the tea on its
  maker's shop, and "In stock" / "Sold out" buttons for signed-in tea drinkers. Matchoji
  never checks shops itself, since the makers' terms and robots.txt rule out scraping.
- Tea supply in numbers (`/regions/supply`), linked from the Regions page: official tea
  harvest figures for the prefectures Matchoji's regions are in. National tiles, then a card
  per prefecture with its tencha (matcha's leaf) output and share, and tea-field and raw-tea
  trends; an "All figures" table and source credits. Figures live in a new
  `tea_production_stats` table, loaded by `supabase/seed/20261023_tea_production_stats.sql`
  from MAFF's crop statistics (e-Stat) and the national growers' federation.
- Scarcity sort: Explore's "Scarcest first" and the Regions page's "Scarcest first" rank teas
  and regions by how scarce their matcha or hojicha is (scarce, tight, plentiful). Regions
  gain `matcha_supply` and `hojicha_supply` levels, seeded by
  `supabase/seed/20261023_region_supply.sql` from public reporting on the matcha shortage;
  region cards show the levels beside the note.
- Explore filters by minimum rating (4.5, 4, 3.5 or 3 and up) and by grade, alongside tea and
  region; on phones the filters fold behind a "Filters" button so results show first.
- Regions (`/regions`): every tea region with its matcha and hojicha counts, linking to
  Explore for that region. Reached from the navbar and Explore's region filter.
- A failed page load inside the site now shows "We couldn’t load this page" with Try again
  and Explore, keeping the navbar, instead of a bare error screen.
- CI builds the app for production with the Supabase vars blank, so a page that would fail
  Vercel's build fails the PR first; Dependabot opens weekly grouped dependency PRs (skipping `@types/node` majors while the app runs on Node 24).
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

- The footer is one slim row under a hairline (61px instead of a 152px grey block); on
  phones its section links give way to the tab bar.
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

- Catalogue, journal and review lookups fetch ids in batches of 100, so pages keep loading
  once there are hundreds of teas or reviewers instead of failing on an over-long URL.
- The journal's loading skeleton and the "How you made it" panel use the same corner radii
  as the rest of the app.
- Explore no longer shows a second search bar in the header, and mock data honours the
  search so Explore can be checked locally.
- Header, tab bar, search and product-page surfaces follow the theme instead of hard-coded
  white, and dark mode keeps the green actions. Unused hover tokens, the unused Geist Mono
  font and the unused discover empty-state component are removed.
- The home page renders per request, so a build without Supabase env vars (Vercel Preview)
  no longer fails prerendering `/`.
- Signed-out visitors adding a new product no longer hit "Could not add that product":
  the dialog sends them through Google sign-in first and reopens with the product filled in.

### Security

- Every insert, update and delete on the app's tables writes an audit-log row (who, what,
  before and after) via database triggers. The log is closed to visitors and users, and
  leaves profile emails out.
- The OAuth callback only redirects to same-origin paths (open-redirect fix).
- Product search strips PostgREST filter syntax from user input.
- Reviews show a display name, never the reviewer's email.

### Removed

- The dev-only mock catalogue (now that the real one is seeded): every page reads Supabase,
  and a missing URL or key fails with a clear "Supabase is not configured" error.
- Unused template widgets (brand logo and text, card, dialog, floating shape, media card,
  pill, theme toggle) and their leftover gradient and float CSS.
- Scaffold `/dashboard` route and the scaffold footer's placeholder credit and link.
