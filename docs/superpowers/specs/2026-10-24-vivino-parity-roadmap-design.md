# Matchoji — Vivino Parity Roadmap

Status: Draft for review
Date: 2026-10-24
Inputs: a read-only audit of this repository (2026-10-24) and an inventory of how Vivino works
today, built from Vivino's own articles and legal centre (May–June 2026). Sources are listed at
the end. Where Vivino does not publish how something works, this spec says so and makes its own
call.

## 1. Intent

Matchoji should feel like Vivino for matcha and hojicha, from capture to purchase:

1. You find a tea, or add one the catalogue lacks.
2. You rate it.
3. Your rating feeds the tea's score and your own taste.
4. That taste shapes what Matchoji shows you next.
5. You can buy the tea from someone who sells it.

Phases 1, 2 and 4, and Phase 3's first slice, built the skeleton. This spec does three things:

- lists what still separates Matchoji from that loop;
- lists what the audit found broken or risky in what already exists;
- orders the work into milestones.

**Non-goals**, carried over from the 2026-09-14 spec:

- no native app;
- no automated vendor KYC;
- no retailer scraping, ruled out by the makers' terms on 2026-10-24.

## 2. Where Matchoji stands against Vivino

| Flow            | Vivino                                                                                                       | Matchoji today                                                 | Gap                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------- |
| Capture         | Label scan (about 1–2 s), text search fallback, submit-for-match                                             | Text search; add a tea, which goes into the review queue       | No scanning; search is plain `ilike`                |
| Unknown product | Submitted label matched by staff within hours; later scans match                                             | `products.status = 'pending'` until an admin approves with SQL | No admin screen; no duplicate merge                 |
| Catalogue       | Wine → vintages, plus winery, region, grape, style                                                           | Flat `products` with region and free-text grade                | No editions (harvest year / flush), no maker entity |
| Rating          | Stars with optional review; taste words mined from reviews; food pairing                                     | Stars, notes, flavour notes, 4 taste sliders, prep, photo      | No food pairing; reviews can't be edited or deleted |
| Roll-up         | Count-weighted average (formula undisclosed); rating per vintage plus overall                                | Plain `avg(stars)` over every review row                       | **One user can inflate a score**; no weighting      |
| Personal taste  | Taste Profile; "Match for You" = chance you'd rate it 4★ or more; starts after 1 rating, useful from about 5 | Journal and want-to-try only                                   | **No taste profile or match score**                 |
| Discovery       | Personalised feed, top lists, style awards, Value Check                                                      | Explore filters and sorts, home shelves, Regions, supply page  | No recommendations, lists or paging                 |
| Social          | Follow, feed, likes and comments, block                                                                      | Public reviews with a display name                             | **None**                                            |
| Lists           | Wishlist, cellar with quantities and drink windows, history                                                  | Want-to-try, journal timeline                                  | No cellar or "my stash"                             |
| Commerce        | Vivino takes the order; merchant is seller of record; payment held at order, taken at shipping               | Listings with a buy link to the vendor's site                  | No checkout, orders or price history                |
| Trust           | Banned fake or self ratings; report → statement of reasons → appeal; labelled sponsored slots                | Audit log; RLS; review queue                                   | No reporting, rate limits on reviews or appeals     |
| Account         | Delete account, GDPR rights, privacy settings                                                                | Sign in or out only                                            | No profile page, deletion or export                 |

## 3. Audit findings to fix first

Two independent read-only sweeps of the repository produced this list on 2026-10-24. Items
marked "verified" were confirmed against the live database or by reading the code directly.

### Security

- **S1. Anyone could edit or delete any profile through `public_profiles` (verified live; fixed by hand on 2026-10-24).**
  - **Cause:** the view runs with its owner's rights and is auto-updatable, and Supabase's default grants gave `anon` and `authenticated` write access to it. A deleted profile cascades to its reviews, want-to-try list and shop.
  - **Fix:** M0 records the `revoke insert, update, delete` in a migration with a test.
- **S2. Users can change their own `role` and `email` (verified).**
  - **Cause:** the profile update policy has no `with check` and no column grants (`phase1_schema.sql:23-25`).
  - **Fix:** only `display_name` is user-editable, 1–40 characters.
- **S3. Writes can attach to teas that aren't approved.** Reviews, want-to-try, stock reports and listings all can.
  - **Fix:** reviews, want-to-try and stock reports may attach only to approved teas, or to the user's own pending tea. Listings may attach to approved teas only.
- **S4. Photos aren't locked down.**
  - **Fix:** `reviews.photo_url` must point into the `review-photos` bucket, under the author's own folder.
  - **Fix:** the bucket gets a 5 MB size limit and image-only MIME types, and anyone can currently list its folders; that listing is removed.
  - **Fix:** a pending tea's adder cannot set `image_url` or `shop_url`.
- **S5. Default display names publish part of the user's email.** The fallback is the text before the `@`.
  - **Fix:** new users default to their Google name, else "Tea drinker" plus a short random suffix.

### Integrity

- **I1. Scores can be gamed (verified).** `product_ratings` averages every row (`phase1_schema.sql:109-115`), and the tea page's distribution, taste profile, notes and preparation also count every row (`summarize-reviews.ts:78-80`), as do the card notes (`products-service.ts:83-87`).
  - **Fix:** everything public counts each user's latest tasting of a tea. The journal keeps every tasting.
- **I2. The database doesn't check lengths or dates.** Zod runs only in the browser.
  - **Fix:** `check` constraints that mirror Zod, for tea name 120, brand 120, grade 60 and review notes 2000 characters.
  - **Fix:** a tasting date can't be more than a day ahead of the database's date, which allows for time zones.
- **I3. A blank tasting date takes the database's day.** That is UTC, so it can be the user's yesterday.
  - **Fix:** the app always sends the user's local date.
- **I4. Nothing stops duplicate teas.**
  - **Fix:** a unique index on `lower(name), lower(coalesce(brand, ''))`.
  - **Fix:** the add-tea step reports "already in the catalogue" when that index refuses an insert.
- **I5. Some failed reads look like empty data.** `hydrateProducts` ignores errors from the regions and ratings reads, and `listReviews` hides a failed name lookup as "Anonymous". All of these must throw.
- **I6. Photo uploads can be orphaned.** A failed review insert leaves its uploaded photo behind, and the raw file name goes into the storage path.
  - **Fix:** remove the photo when the insert fails, and use a random name with the file's extension.
- **I7. Rejecting a tea hides other people's tastings of it.**
  - **Fix:** a rejected tea stays readable to anyone who tasted it or saved it to want-to-try. The journal labels it "Not in the catalogue". Merging (M1) moves the tastings to the surviving tea.
- **I8. Non-approved tea pages show buying and stock tools.** Fix: hide "Where to buy" and stock reports on non-approved teas.
- **I9. Two indexes are missing:** `reviews(product_id)` and `listings(product_id)`.
- **I10. App tests can't catch query mistakes.** The fake Supabase client ignores filters and RLS, so status and permission rules are tested in PGlite.

### Scale and discovery (M1)

- **D1. Lists load everything.**
  - **Problem:** `listProducts` loads the whole approved catalogue and every review's notes, and the home page calls it 3 times.
  - **Fix:** paging. The grade and rating filters move into SQL; today they run in the app.
- **D2. One 5★ review outranks 100 reviews at 4.8★.**
  - **Fix:** a weighted score, `(v·R + m·C)/(v + m)`, with m = 5 and a 3-rating minimum for "Top rated". R is the tea's average, v its rating count and C the catalogue average.
- **D3. Search can miss approved teas, and its escaping is incomplete.**
  - **Cause:** it fetches 20 unordered rows, then filters in the app, and `_` and `"` are not escaped.
  - **Fix:** filter in SQL, add a trigram index, and order by relevance.
- **D4. Each Want-to-try button checks the sign-in separately.** That is about 36 checks on the home page. Fix: share one session context.

### UX

- **U1. Phones can't reach `/sell`, `/regions` or `/regions/supply`.**
- **U2. Some pages are generic.** There is no `not-found.tsx`. `/sell` and `/regions/supply` have no loading state. No page has its own title, Open Graph tags, sitemap or robots file.
- **U3. Screen-reader labels are unclear.** The rating distribution and the big score read without "stars" or "out of 5".
- **U4. The account menu has only Sign out** (see M2).
- **U5. Rejected shops are pointed to an email that was never sent,** and they can't re-apply.

### Operations (M6)

- **O1. Migrations are run by hand.** That led to a run against the wrong project on 2026-10-24.
- **O2. `database.types.ts` is hand-written** and can drift from the schema.
- **O3. There is no monitoring.** Storage uploads and deletes aren't audited.

## 4. Milestones

Each milestone ships as one or more PRs under the existing gates: tests, READMEs, changelog, audit triggers on new tables, and RLS tested in PGlite. Order matters: M0 protects the data the later milestones build on.

### M0 — Integrity hardening (§3 S1–S5, I1–I10)

- **One migration:**
  - `public_profiles` writes revoked;
  - profile column grants, plus the new display-name default;
  - `product_ratings` counts each user's latest review per tea;
  - status-aware insert policies;
  - length and date checks;
  - photo-URL check, plus storage size and MIME limits and no bucket listing;
  - a unique tea index;
  - a read rule so people who tasted or saved a rejected tea can still see it;
  - indexes on `product_id`.
- **App:**
  - the tea page summary and card notes count latest tastings only;
  - hide offers and stock reports on non-approved teas;
  - read errors throw;
  - the journal and want-to-try label teas not in the catalogue;
  - add-tea reports a duplicate;
  - the tasting date is always sent;
  - photo cleanup and safe file names.
- **Done when:** PGlite tests prove each database rule, app tests cover the rest, and the suites pass.

### M1 — Catalogue care and scale (§3 D1–D4, U1–U3, U5; admin)

- **Admin role:** admin writes go through a security-definer function that checks the admin flag. Column grants can't let only admins write `status`.
  - `profiles.is_admin`, set by SQL once;
  - RLS lets admins update `products.status`, `image_url`, `shop_url` and `vendors.status`.
- **`/admin` review list:**
  - pending teas and shop applications, each with Approve and Reject;
  - Reject asks for a reason, which the adder sees (Vivino gives a "statement of reasons");
  - "Merge into…" for a duplicate tea moves its reviews, want-to-try rows, stock reports and listings to the surviving tea, then marks it rejected with the reason "duplicate".
- **Product images:**
  - a `product-images` bucket, admin-only writes;
  - admins upload a maker-permitted packshot or leave the drawn tin;
  - taster photos are never promoted automatically.
- **Explore and shelves:**
  - Explore pages 24 teas at a time, "Showing 1–24 of N", as the Vivino-style spec promised;
  - the home shelves each fetch 8;
  - the top flavour notes come from a view.
- **Ranking:** the weighted score drives "Top rated", with the 3-rating minimum.
- **Search:**
  - `pg_trgm` index on name and brand, so typos still match;
  - search also covers grade and region names.
- **Pages:** `not-found.tsx`, loading states for `/sell` and `/regions/supply`, per-page titles via `generateMetadata`, mobile entry points for Sell and Regions.

### M2 — Your taste (the most "Vivino" feature)

- **Taste profile** (`/journal` → "Your taste"), built from your ratings:
  - favourite flavour families;
  - average taste-slider positions for the teas you rated 4★ or more versus under 3★;
  - matcha versus hojicha split;
  - preferred grades and regions;
  - preferred preparation, e.g. usucha versus latte.
  - Shown once you have 1 rating, labelled "early" under 5. Vivino starts after 1 and calls 5 "a starting point".
- **Match score:** the chance you'd rate a tea 4★ or more, shown as a percentage band.
  - Bands follow Vivino: 70–100 "great match", 40–70 "average", under 40 "low".
  - Computed from the distance between the tea's community taste profile (average sliders, top notes, grade, region, category) and your profile for teas you liked versus disliked.
  - **Model:** a plain, explainable scoring function in SQL or TypeScript, not machine learning. It is recomputed on read, with a cached per-user profile row refreshed on each new review.
  - Shown on tea pages and Explore rows for signed-in users with at least 1 rating.
  - Explore gets a "Best match for you" sort.
- **Review editing and deletion:** owner update and delete policies; the journal entry gets Edit and Delete.
- **Account page** (`/account`):
  - edit your display name;
  - see your shop, if you have one;
  - export your data (journal, reviews, want-to-try) as JSON;
  - delete your account. Your reviews are kept in anonymised form, as Vivino does.
  - **Deletion needs schema changes first.** Today `reviews.user_id` is `not null … on delete cascade`, so deleting an account would delete the reviews too. It becomes nullable with `on delete set null`.
  - **Audit rows need scrubbing too.** Deletion also removes `user_id` and `display_name` from the user's audit rows, not just the actor.
  - **Photos:** storage objects under the user's folder are removed.
- **Rate limits** like `stock_reports`: at most 20 new teas and 60 reviews per user per day.

### M3 — Social

- **Public profiles** (`/u/[id]`): display name, rating count, recent tastings and taste profile. Each user can make them private.
- **Follows:** a `follows(follower_id, followee_id)` table and a block list.
- **Activity feed:** the latest tastings of people you follow, on the home page when signed in, alongside Vivino-style top lists.
- **Reactions:** likes and comments on reviews, with `review_likes` and `review_comments` tables and owner-delete.
- **Reporting:**
  - a report button on reviews, photos and comments, stored in `content_reports`;
  - the admin list (M1) gains a reports tab;
  - the reporter sees the outcome and its reason.
- **Notifications:** in-app only at first (`notifications` table and bell): follows, likes and comments on your reviews, your tea approved or rejected, your shop approved. Email comes later; it needs a provider key on the server.

### M4 — Editions (vintages for tea)

- **Editions:** `product_editions(product_id, harvest_year, flush)`, where flush is one of first, second, autumn or unspecified. A tasting may name an edition.
- **Roll-up:** a tea's score stays the roll-up across editions, and each edition shows its own score once it has 3 ratings.
- **Badges** follow Vivino's vintage badges: "Top rated harvest" and "Popular: more than 30 ratings".
- **Cellar / stash:** an optional quantity on want-to-try entries you own, with an "opened on" date. Matcha goes stale after opening, so the tea page shows a freshness hint taken from that maker's own storage guidance, checked per maker before it ships.

### M5 — Commerce (Phase 3 rest)

- **Prerequisites:** these are the user's calls; the agent cannot do them.
  - A Stripe account with Connect, in test mode first.
  - The legal check on cross-border tea sales.
  - Agreement that Matchoji, like Vivino, takes the order while the vendor is seller of record.
- **Checkout:**
  - per-vendor carts, run through Stripe Checkout on Connect accounts;
  - payment held at order and taken when the vendor marks the order shipped, as Vivino does;
  - an application fee per sale.
- **Server code:** a route handler, plus a webhook route with signature checks. Writes use a Supabase role scoped to orders only, never the service-role key in the browser. Route tests cover 401, 200 and the error paths, per the constitution.
- **Orders:** `orders.listing_id` gets `on delete restrict` and keeps a snapshot of name, price and currency, so deleting a listing never loses order history. `orders` and `order_items` with status pending → paid → shipped → delivered, or cancelled or refunded. Buyer and vendor order pages.
- **Price history:** `listing_prices(listing_id, price, currency, at)`. This later allows a Value-Check-style "good price" tier once there is 3 months of data.
- **Vendors proposing teas:** vendors can propose a new tea from the listing form, which enters the review queue (the Phase 3 spec promised this).

### M5b — Farm tools (Phase 4 rest, needs M5 orders)

- **Vendor analytics:** rating trend per listed tea, plus views, clicks on "Buy from…" and orders per listing.
- **Demand signals for growers:** what is rating well, rising in want-to-try, and reported sold out, by region and category.

### M6 — Operations (§3 O1–O3)

- **Migrations:** Supabase CLI (`supabase/config.toml`), `supabase db push` documented, and a CI check that fails when the repo has migrations the linked project lacks.
- **Types:** `database.types.ts` generated in CI, with a check that it is committed fresh.
- **Monitoring:** error tracking with a free-tier provider, and `/api/health` calls a tiny `health()` database function, because PostgREST can't run `select 1` on its own.
- **Local dev:** `supabase start` with seeds, so `pnpm dev` works without production keys.
- **Small fixes:**
  - the OAuth callback builds redirects from `getAppOrigin`;
  - the CSP gains `img-src` and `script-src`;
  - `proxy.ts` skips `/api/health`.

### Deferred

- **Label scanning:** it needs an image-recognition service and a packshot for every tea. Revisit once M1 images cover most of the catalogue.
- **Menu scanning, editorial top lists and style awards:** these need volume; Vivino's awards need 50 or more ratings per wine.
- **Food pairing:** low value for tea; possibly sweets pairings later.

## 5. Decisions taken in this spec (my calls; change any)

- **One public rating per user per tea:** the latest. The journal keeps every tasting.
- **Weighted score:** prior m = 5 and a 3-rating minimum for "Top rated". Vivino weights by count but doesn't publish how.
- **Match score is an explainable function, not machine learning,** at this scale.
- **Deleting an account keeps reviews, anonymised,** as Vivino does, and anonymises the audit actor.
- **Admin is a flag on the profile, set by SQL.** There is no admin sign-up.
- **Notifications are in-app only** until there is a reason to pay for email.

## 6. Decisions only the user can make

1. Commerce model and Stripe account (M5), and the legal check on shipping tea abroad.
2. Whether profiles are public by default (M3); Vivino's are.
3. Whether to show a match score to signed-out visitors as a teaser (Vivino gates exact numbers behind Premium).
4. Which error-tracking provider (M6), since it means another account.

## 7. Sources

Vivino:

- [How the label scanner works](https://www.vivino.com/en/wine-news/how-the-vivino-label-scanner-works)
- [The complete guide to the Vivino experience](https://www.vivino.com/en/wine-news/the-complete-guide-to-the-vivino-experience)
- [Match for You explained](https://www.vivino.com/en/wine-news/vivinos-match-for-you-score-explained-how-we-learn-your-taste)
- [Value Check](https://www.vivino.com/en/articles/br-valuecheck)
- [Ranking and algorithmic transparency](https://www.vivino.com/en/legal/ranking-algorithmic-transparency)
- [Community content guidelines](https://www.vivino.com/legal/community-content-guidelines)
- [Trust and safety policy](https://www.vivino.com/en/legal/trust-and-safety-policy)
- [Terms of sale](https://www.vivino.com/en/legal/terms-of-sale)
- [Privacy policy](https://www.vivino.com/en/legal/privacy-policy)

Repository audit: findings cite `path:line` in this spec; the full list was produced on
2026-10-24 and its high and medium items are all reflected in §3 and §4.
