# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Database schema for café drinks (migration `20261110000000_cafes_and_drinks.sql`, slice S1 of the repositioning; the owner applies it in the Supabase SQL editor before the app slices that use it merge): cities (Singapore, Johor Bahru), cafés and drinks that anyone signed in can suggest for review, trusted tasters with Instagram-linked drink reviews kept apart from the community score, café and drink rating views, merges, admin edit functions and moderation notifications. Deleting an account also unlinks a taster's reviews, and a rejected café hides its drinks. Nothing in the app uses it yet, and teas are unchanged.

- Café and drink pages, the read side of the repositioning (slice S3; needs the S1 schema applied, and shows empty lists before). `/cafes` lists a city's cafés with a map, an area filter and a taster-reviewed-only filter (`?city=`, else a remembered city cookie, else Singapore); `/cafes/<slug>` shows a café's drinks and latest trusted-taster reviews; `/cafes/<slug>/<drink>` shows the taster score and community score side by side, never blended, with the trusted-taster reviews first, "n of m taster reviews were gifted/paid" where it applies, the tea used and similar drinks. `/c/<slug>` is a 308 short link to the café. A merged café or drink forwards to its survivor and a rejected drink to its café, so links shared on Instagram never 404. Link-preview images, JSON-LD, metadata and sitemap entries cover approved cafés and drinks. A chain of merges is followed to its final survivor in one redirect, and a loop is not-found. The drink page shows its photo with the credit. The sitemap reads every café and drink past the 1000-row API cap. Rating a drink and adding a café come in later slices.

- Admin moderation for cafés, drinks and trusted tasters on `/admin`: Cafés and Drinks tabs list suggestions waiting for review with who added them, and an admin can approve, reject with a note the submitter sees, or merge one into an approved duplicate, and edit an approved café's or drink's details (a drink's photo, photo credit and linked tea too). A Tasters tab searches people by display name (private profiles included) and grants or revokes the trusted-taster badge. The database's own refusals, such as approving a drink at a café that is not approved, are shown as they are. No migration.

### Changed

- The admin reports queue handles a reported drink review: it names the café and drink instead of a tea, and no longer breaks on a review with no tea.
- Café drink reviews no longer break the places that read reviews (slice S2; needs the S1 schema applied for drinks to appear, and shows nothing for them before). A drink review can carry a "Trusted taster" chip, a disclosure badge (Invited, Gifted, Paid partnership) and a link to the taster's Instagram post. The journal, a profile's recent tastings and the following feed list drink tastings with their café; stats, the year in tea, the taste profile, taste match, top notes and a profile's tea count still count teas only. Notifications on a drink link to the drink, and café and drink decisions to the café or drink. Your data export now includes the cafés and drinks you added. Drink rows in the journal have no edit or delete yet.
- Matchoji's positioning is now "the trusted guide to hojicha and matcha drinks in Singapore and Johor Bahru, rated drink by drink", and `PRODUCT.md` is rewritten to match. The parked marketplace is hidden behind one switch, `MARKETPLACE_ENABLED` in `src/lib/constants/env.ts`: `/sell` returns not-found and drops out of the sitemap, and a tea page shows "Where to buy" only when the switch is on and the tea has an offer. The marketplace tables and code are untouched. No migration.
- Tea pages show no empty chrome: an unrated tea gets one quiet "Not yet rated" line instead of a dash and a count, and the stock panel appears only once a report exists or the visitor is signed in.
- Explore's grade filter lists matcha grades apart from hojicha grades, and `/offline` no longer reads as tea-only.

- Claude Code harness re-synced to templateCentral 7.2.2: the SessionStart hook re-injects the CONSTITUTION instead of the head of `AGENTS.md`, the dependency-audit gate parses `package.json` for advisory suppressions, `settings.json` drops the broad `.env.*` read denies, and `AGENTS.md` documents the user-scoped `superpowers` plugin install.

### Fixed

- The year-in-tea page (`/journal/year/<year>`) no longer keeps its "Your year in tea" tab title when it renders not-found; `generateMetadata` gives a malformed year or a year with no recap the not-found title, sharing one read with the page.
- `test/scripts/schema-check.test.ts` no longer times out intermittently on CI runners. `extractShape` re-parsed about 60 TypeScript lib files for every program it built; those are now parsed once per process and shared, which also speeds up `pnpm schema:check`.
- A `.pnpm-store/` cache inside a worktree no longer fails `pnpm check` (Prettier and ESLint now skip it; it is also git-ignored).

## [0.1.0] - 2026-11-03

### Added

- Your stats and a year in tea. `/journal` now shows teas rated, matcha against hojicha, your average rating, favourite notes and, once you have 3 tastings, your top maker, top region and usual preparation (a favourite must appear at least twice) plus the tasting days this month and your longest run. Each year with 3 or more tastings gets a "Year in tea" page at `/journal/year/<year>` (`/journal/year` opens this year): totals, your first and latest tasting, highest-rated tea, busiest month, the newest maker you tried and how the teas you love moved against earlier years. It is for you only. If your profile is public, "Share your year" opens the share sheet (or copies the link) for a public page at `/u/<id>/year/<year>` whose preview image shows counts and tea names, never notes. Public profiles also show a short stats strip (teas rated, matcha and hojicha counts and, from 3 teas, a top region); private profiles show it to nobody else. No migration.
- Tea pages carry `Product` structured data, with a star rating only once the tea has one; every page names its canonical URL; Explore, Regions, Shops and Supply have their own descriptions; `robots.txt` also skips `/api/`.
- `pnpm e2e`: read-only Playwright smoke tests of the live site (home, search, a tea page, regions, shops, sign-in prompt, dark theme, no console or CSP errors), run daily and on demand by `.github/workflows/e2e.yml`.
- Tea pages show a "Goes well with" section: up to four sweets a tea house itself pairs with the tea, each with a source link. Hojicha: ichigo daifuku, castella and zenzai; drinking matcha: higashi, cream puffs and kashiwa mochi (all from Ippodo's pages). Matcha graded for lattes or baking, and any tea with no sourced pairing, shows no section.
- The installed app now has a small offline fallback. A service worker (production only) caches build files and icons and shows a "You're offline" page with a retry button when a page can't load; pages themselves are never cached, so nothing signed-in is kept or shared. The content security policy now allows same-site workers (`worker-src 'self'`), and `/sw.js` is served uncached and skips the proxy.
- Catalogue expansion: 31 more real teas (Ippodo, Marukyu Koyamaen, Horii Shichimeien, Kettl) and 4 more shops (Marukyu Koyamaen at Kyoto Takashimaya, Horii Shichimeien's Uji store, Kettl's Brooklyn and Los Feliz cafés). Every tea's name, grade, region, pack size and price come from the maker's own shop page, linked as its shop link; prices are converted to S$ at the ECB reference rate of 2026-11-02 and grade or region is left empty where the maker doesn't state it. Run `supabase/migrations/20261104000000_catalogue_expansion.sql` in the SQL editor (safe to rerun). No ratings or photos.
- Price history. Every time an admin changes a tea's reference price or pack size, the old price is kept, and a tea's page shows a small sparkline of price per gram under its price with a line such as "Up 12% since Mar 2026" or "No change since Mar 2026" (it hides until a tea has two recorded prices). The admin Prices form lists the tea's last five prices. History is filled by a database trigger, so nothing in the app writes it, and teas already priced start their history on the day the migration runs. Run `supabase/migrations/20261104100000_tea_price_history.sql` in the SQL editor; until it runs, tea pages simply show no trend.
- Shared links now carry a preview image. Tea pages show the tea's photo (or a drawn tin), name, maker, category and rating; taster profiles show the name and teas rated; every other page shows the Matchoji card. Private profiles share the plain Matchoji card, with no name or counts. Links also ask for large cards on Twitter/X. Images are drawn on our own server from a bundled font, with no outside service.
- Matchoji can be installed on a phone's home screen from the browser menu ("Add to Home Screen" / "Install app"): it opens full-screen with its own icon and a green theme. Icons come in standard, maskable and Apple sizes, plus a favicon, and the browser bar follows light and dark. Offline, it shows only a "You're offline" page (see the offline fallback entry).
- Discovery from Matchoji's own data: a "Great value" badge on a tea rated well for its price per gram against its own category (rating percentile minus price percentile; needs 5 ratings and a price) and a "Best value" Explore sort; up to three computed highlights on a tea's page ("Top 10% of hojicha on Matchoji", "Highest rated from Uji", "Most rated ceremonial matcha"), shown only with enough ratings and a big enough comparison group; a "Similar teas" shelf of up to 8 teas by category, grade, region and taste; and `/top` lists (Top matcha, Top hojicha, Best value, Top from each region) ranked by a count-weighted average so one rating can't top a list. A list appears, and joins the sitemap, only once 5 teas have 3 ratings each. `/top` is linked from the footer and the home shelves' "See all". No migration.
- Maps. `/regions` now has a map of the growing regions above its cards: each pin shows the region's tea count (and "Scarce" when its supply is), coloured by whether matcha or hojicha leads, and opens that region's teas. A new `/shops` page maps real shops (makers' own stores, stockists, cafés) with a list you can filter by maker, kind and country, each with the address, a Directions link and the source page the address came from. The tea page links to a maker's shops when there are any, and the footer links `/shops`. Admins manage shops in a new Shops tab. Maps use free OpenStreetMap tiles (no key or account) and no farm locations are shown. Run `supabase/migrations/20261103000000_shop_locations.sql` in the SQL editor; it seeds Ippodo's Kyoto and Shin-Marunouchi stores, and until it runs `/shops` shows no shops. The content security policy now allows `https://tile.openstreetmap.org` for images.
- Scan a tea label to log a tasting: "Scan label" in the Log a tasting dialog opens the camera, reads the tin or packet (Japanese labels included), and either preselects the matching tea or pre-fills the add-a-tea form. You always confirm before anything is saved, and the photo is not stored. Up to 20 scans a day. It stays hidden until the server's `ANTHROPIC_API_KEY` is set.
- `pnpm schema:check` compares the live database with the repo over a read-only, project-scoped connection string (`SUPABASE_DB_URL`, no Supabase access token): every migration file must be applied and every applied version must have a file, and `database.types.ts` must match `supabase gen types` on tables, columns, nullability and enums. It skips when the URL is unset. A new `schema-check.yml` workflow runs it on PRs touching `supabase/**` or the types, weekly, and on demand; `docs/schema-checks.md` has the role and secret setup. The types now include `orders` and `audit_log`.
- Optional error tracking with Sentry. It does nothing until `SENTRY_DSN` and
  `NEXT_PUBLIC_SENTRY_DSN` are set in Vercel. Errors from route handlers and the error pages are
  reported with emails, cookies, auth headers and Supabase tokens scrubbed, no session replay and
  10% trace sampling; browsers send through the same-origin `/monitoring` route. A new global error
  page covers failures in the root layout.
- A Light / Dark / System theme control in the footer. Light stays the default and the site only
  goes dark when a visitor picks it. Dark mode now holds up everywhere: the matcha and hojicha
  colours are lifted so text and badges clear 4.5:1 on black, field edges and the focus ring clear
  3:1 on every dark surface, empty stars, hover borders and the like button follow tokens, the drawn
  tins are brightened on dark tiles, and date fields render in the dark scheme.
- Harvests with more than 30 ratings show a "Popular" badge beside "Top rated harvest".
- A tea you have opened shows a freshness hint on its page: days since opening and, for makers
  whose own site states a figure (Ippodo, Aiya), their guidance with a source link; other makers
  get general advice and a link to "Keeping matcha fresh".
- Photo credits: a tea's photo can name who it is from, shown as "Photo: …" under it, and
  admins can now keep the current photo while editing a tea, or remove it. The footer says
  how to ask for a photo to be taken down.
- Courses in the Learn tab: Matcha 101 (five lessons, from what matcha is to buying your next
  tin) and Hojicha at home (three), each lesson ending in a recipe to make and log. Signed-in
  learners can mark lessons done and see their progress.
- Tea prices: each tea can show its pack price in Singapore dollars, price per gram, what a cup
  costs (usucha, koicha or a hojicha cup) and whether it is budget, mid-range or premium among
  teas of its kind. Explore can sort by lowest price per gram, and admins set prices on the
  review page.
- A Learn tab with recipes (usucha, koicha, iced matcha, matcha and hojicha lattes, steeped
  hojicha) giving dose, water, temperature, steps and tips, plus guides to grades, tools,
  storage and why matcha sells out. "Log a tasting with this recipe" fills in its brew settings.
- `/api/health` now checks the database and answers 503 when it is down, for uptime monitors.
- Local Supabase setup (`pnpm db:start`) and scripts to check migrations and regenerate types.
- Harvests, tea's vintages: a tasting can name its harvest year and flush, and a tea's page
  compares its harvests with a "Top rated harvest" badge, as Vivino compares vintages.
- A stash on want-to-try: how many you have and when you opened it, shown as days since
  opening.
- Like and comment on reviews, and report a review or comment to the admins; admins remove or
  keep it from `/admin`, and the reporter is told the outcome and why. A notification bell
  shows new followers, likes and comments, and the outcome of your tea suggestions, shop
  applications and reports.
- Taster profiles (`/u/…`, linked from every review): name, teas rated, followers, their taste
  and recent tastings, with Follow and Block. Signed-in readers see "From people you follow" on
  the home page. Profiles are public by default; make yours private, and manage who you've
  blocked, from Your account.
- Edit or delete your own tastings from the journal; a new photo replaces the old one.
- Your account (`/account`, linked from the account menu with Sell on Matchoji): change the
  name on your reviews, download all your data as JSON, or delete your account. Your ratings
  stay on the teas, unnamed, as on Vivino; everything else goes, including your trace in the
  audit log.
- Daily limits of 60 tastings and 20 suggested teas per person.
- Match for you: signed-in tasters see how likely they are to love a tea ("86% match · Great
  match"), worked out from their own ratings of the most similar teas and naming them
  ("Because you rated Sayaka-no-mukashi 5★"). Explore rows show the match, and "Best match for
  you" sorts by it.
- Your taste, in the journal: favourite notes, how you like your tea, teas per category, and
  the taste of teas you loved against those you didn't.
- Explore pages its results 24 at a time ("Showing 1–24 of N", Previous/Next), with every
  filter and sort run by the database instead of loading the whole catalogue; the home shelves
  fetch only what they show. "Top rated" now weighs how many people rated a tea, so one 5★
  rating no longer outranks a hundred at 4.8★, and teas with fewer than 3 ratings rank below.
- "Log a tasting" search forgives typos and ranks the closest matches first.
- Regions, Tea supply and Sell are linked from the footer on phones too; every page has its
  own title, tea pages get link previews, and there is a sitemap, robots rules and a "not
  found" page inside the site. Screen readers hear ratings as "4.2 out of 5" and the rating
  spread as "5 stars: 3 ratings".
- Review queue (`/admin`, admins only): approve or reject teas tasters added and shop
  applications with a reason the submitter sees, merge a duplicate tea into the one it repeats
  (its tastings, saves, stock reports and listings move over and its page forwards), and set a
  catalogue tea's photo and shop link. A rejected shop now sees the reason and can apply again.
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

- Pages without a map no longer load Leaflet's stylesheet (13.5 KB, render-blocking), and the Log a tasting form (React Hook Form, label scan, product search, rating form) is fetched the first time the dialog opens instead of with every page; first-load JavaScript is about 110 to 140 KB lighter (uncompressed) per page, and the dialog stops fetching regions on pages where nobody opens it. The navbar no longer jumps when the session resolves. Before and after scores are in `docs/superpowers/specs/2026-11-04-performance-pass.md`.
- UI polish from an impeccable critique (`docs/superpowers/specs/2026-11-03-impeccable-critique.md`):
  home shelves read "Matcha to try" / "Hojicha to try" while nothing is rated, Explore rows drop the
  empty score dash on phones, the product page hero is shorter on phones, the second "Add your
  rating" card shows only once a tea has reviews, the stock prompt says what it asks, region cards
  stop repeating the prefecture and label supply, Journal and Account headings match the other
  pages, Learn course cards use the neutral tile, and dark-mode tins are less blown out.
- Forms and editing pages got a tidy-up. Account settings sit in sections with a one-line
  purpose; the admin page is tabs (Review queue, Reports, Tea photo, Tea price) with counts, and
  its tea pickers are selects. The photo form shows the tea's current photo and credit. Prices,
  grams, millilitres and temperatures show their unit inside the field, flavour is a select,
  and buttons and taps are at least 40px high with a stated reason when Save is off. New copy:
  "Back to search", "Reset", character counters, and short purpose lines.
- The footer is grouped again: the wordmark and tagline, the links the navbar does not have
  (Tea supply, Sell on Matchoji; Regions too on phones, which have no Regions tab), and a
  fine-print row with the year, "A hobby project" and the photo takedown link.
- Back links on Learn, supply and sign-in error pages share one widget with a chevron, a
  40px hit area and a focus ring; the lesson's previous and next links match.
- Explore shows 12 teas with a "Show more" button instead of Previous and Next. The count is
  in the URL (`shown=`), so Back and shared links restore the same list; changing a filter or
  the sort starts again at 12. Old `?page=` links still open the first 12.
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

### Removed

- The dev-only mock catalogue (now that the real one is seeded): every page reads Supabase,
  and a missing URL or key fails with a clear "Supabase is not configured" error.
- Unused template widgets (brand logo and text, card, dialog, floating shape, media card,
  pill, theme toggle) and their leftover gradient and float CSS.
- Scaffold `/dashboard` route and the scaffold footer's placeholder credit and link.

### Fixed

- Every page reported a `script-src blocked eval` content security policy violation in the browser console: Zod probed for `new Function` to speed up parsing. Zod's JIT is now off in the browser, so the policy stays strict with no violations.
- Regions map: a scarce region's pin no longer reads "0 · Scarce" in a wide pill that overlapped its neighbours near Kyoto, Nara and Mie. Pins show only the tea count, scarce supply is a red dot, and the full supply text is in the tooltip and the pin's accessible name.
- Cleared two moderate Dependabot alerts (`glob` AbortSignal bypass, `minimatch` globparts DoS) with `pnpm-workspace.yaml` overrides to `glob` 14.0.2 and `minimatch` 11.0.1.
- The account page's "Make my profile private" / "Make my profile public" button and the blocked-list "Unblock" buttons now meet the 44px tap-target standard (they were 40px).
- The navbar wordmark no longer overlaps "Explore" at tablet widths: it keeps its width, the nav
  links, Log button and bottom tab bar switch at 768px, the header search pill waits for 1024px,
  and gaps tighten below that.
- Controls that were 36–40px tall now meet the 44px tap-target standard: the navbar and empty-state
  "Log a tasting" buttons, the account name, delete-confirm, Save, download and delete controls, the
  admin tabs, tea pickers, photo, credit, shop-link and price fields and buttons, and the "Remove
  photo" row.
- Accessibility pass from a token and source audit: form field edges are now 3:1 against the page
  (they were 1.6:1), the dark theme's green is lifted so brand text and buttons clear 4.5:1 on
  black, the course tick and the tab-bar badge follow the brand foreground token, loading
  skeletons announce as a busy status, the "Done" tick has an image role, the standalone error
  and sign-in-failed pages have a main landmark and one h1, and the listing form's tea picker
  has a 44px tap target on mobile.
- Real-browser audit fixes: the matcha green is a shade darker so its text clears 4.5:1 on grey tiles
  (the supply page's tencha figures were 4.35:1); unknown URLs now keep the navbar and footer, get
  a "Page not found" title and Explore and Home links; a "Skip to content" link is the first
  focusable element of the site shell; and controls that measured under 44px on phones (sign in,
  filters, search, sort, show more, want to try, stock buttons, lesson and recipe buttons, guide and
  region pills, back links and several text links) now reach 44px there.
- Touch targets on phones are now at least 44px: the navbar search and account buttons, the
  notification bell, star-rating inputs, the Explore filter options and the footer links.
  Navbar section links, the card bookmark button and the notification count badge were also
  enlarged or made legible.
- Tasting photos and tea images load lazily and decode off the main thread.
- Signed-in users' Google profile pictures show again in the navbar.
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

- Updated a transitive HTTP redirect library (`follow-redirects`) to 1.16.2, which fixes a
  high-severity advisory.
- The sign-in callback no longer trusts a forwarded host that is not the site's own when
  building its redirects.
- The content security policy now restricts scripts: only this site's own files and scripts carrying
  a per-request nonce run, so an injected inline script is blocked. Every page is now rendered per
  request to carry that nonce.
- A private profile now keeps its tastings off the API: they still count towards every tea's
  score and show on tea pages as "Private taster" (no name, link or photo), but nobody else can
  list them, see them in a feed, or see who a private taster follows.
- Daily limits can no longer be dodged by backdating, stock reports and feed entries can no
  longer be dated into the future, and likes and follows have daily limits.
- Review photos must be the author's own upload on Matchoji's storage, and pages load images
  only from the site and its storage, so a review cannot carry a tracking image.
- Who has blocked whom can no longer be looked up, and deleting an account also removes the
  person's id from follows, blocks, reports and photos in the audit trail.
- Suggested teas and shop applications cannot arrive with admin-only fields, sign-in redirects
  are never cached, and malformed request ids are not logged.
- Profiles can no longer be edited or deleted through the public profile view (closed by hand
  on 2026-10-24 and now recorded in a migration); users can change only their display name,
  and default names no longer use part of the email.
- Ratings, want-to-try, stock reports and listings attach only to teas in the catalogue (a
  taster may still rate the tea they added while it awaits review). Review photos must be the
  author's own upload, at most 5 MB, and the photo bucket can no longer be listed.
- Every insert, update and delete on the app's tables writes an audit-log row (who, what,
  before and after) via database triggers. The log is closed to visitors and users, and
  leaves profile emails out.
- The OAuth callback only redirects to same-origin paths (open-redirect fix).
- Product search strips PostgREST filter syntax from user input.
- Reviews show a display name, never the reviewer's email.
