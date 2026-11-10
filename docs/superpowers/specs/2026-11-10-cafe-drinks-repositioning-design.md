# Matchoji: café-drink repositioning and cleanup (design)

Date: 2026-11-10. Status: owner questions answered 2026-11-10; awaiting approval of the full document. When approved, this goes in the repo at
`docs/superpowers/specs/2026-11-10-cafe-drinks-repositioning-design.md`, and the earlier
`2026-09-14-matchoji-design.md` gets a note pointing to it.

## 1. Intent and why

Matchoji's stated moat, "matcha and hojicha in one app", is easy to copy, and the live site has no ratings at all.
The owner runs a hojicha review Instagram (foodcnl) covering cafés across Singapore and Johor Bahru, and wants
each post to send readers to that café on Matchoji. That gives Matchoji its real wedge:

> **The trusted guide to hojicha and matcha drinks in Singapore and JB, rated drink by drink.**

- **Drink-level local data.** Google and Burpple rate a café. Nobody rates _that café's hojicha latte_ on roast
  depth, sweetness, tea strength and price per cup. That dataset doesn't exist yet.
- **Trusted tasters above the crowd.** The owner and, later, invited influencers carry a visible badge and each
  links the Instagram post behind their review. Their score sits apart from, and above, community ratings.
- **Distribution the owner already has.** Each IG post leads to a café or drink page, some visitors rate their own
  visit, and the data grows past the owner's reviews.
- **Packaged teas stay as the "brew it at home" layer.** A drink can name the tea it's made with, and a reader who
  loves it can find that tea, its price and how to brew it. The existing catalogue, learn content and region data
  live here.

## 2. Goals

1. Café and drink entities, with a café page and a drink page that are the landing pages for IG posts.
2. Trusted tasters: a badge, an IG handle and bio on the profile, and an IG post link plus a disclosure (paid,
   gifted, invited or none) on each review.
3. A drink's taster score and community score are shown separately, with the taster score first.
4. Discovery for SG and JB: a café map and list with a city switch and area filter, plus top lists by drink style
   and city.
5. A home page, navigation and copy rewritten for the new positioning. Discovery comes first, and the at-home
   layer is demoted.
6. A cleanup sweep: remove dead ends and empty chrome, hide parked Phase 3 surfaces, and bring the docs in line
   with what the code does.
7. Share cards (OG images) for café, drink and taster pages, because these links get posted on Instagram.

## 3. Non-goals

- No commerce, checkout or vendor payments. M5 stays parked (no ACRA entity or Stripe yet).
- No turning label scanning or Sentry on. The code stays inert; the owner said to leave them.
- No influencer self-signup or invite emails. An admin grants the trusted-taster badge by hand at this scale.
- No opening hours, reservations or delivery integrations.
- No automatic import from Instagram (API terms, tokens). Posts are linked by URL.
- No cities beyond Singapore and Johor Bahru yet, though the city list is data rather than hard-coded so it can
  grow.

## 4. Anti-goals (a failure even if it works)

- Becoming a general food review site. Only hojicha and matcha items are allowed.
- Paid or gifted posts burying honest ratings. Disclosure is always shown, and the rules in §6.4 hold.
- Fabricated content. No made-up cafés, reviews, scores or follower counts. Seed only real cafés from real sources,
  and only the owner's real reviews (PRODUCT.md "Evidence on Hand" rule still applies).
- An empty-looking site. Empty sections hide rather than showing "no data" chrome everywhere.

## 5. Constraints

- Stack and rules as in `AGENTS.md` and `docs/CONSTITUTION.md`: Next.js 16 (async `params`/`cookies`), Supabase
  directly, Zod at every boundary, feature modules under `src/features/<name>/`, audit log on mutations, tests per
  constitution §4, CI gates (diff-cover ≥80%, changelog, a README per changed folder, comment hygiene).
- Constitution §2: `products` must stay seller-agnostic. Drinks may reference a product; a product never
  references a drink or café.
- The owner applies migrations by hand in the Supabase SQL editor. Each migration is a standalone file, and the
  services fall back cleanly when a new table is missing (Postgres errors `42P01` / `PGRST205`), as existing ones
  do.
- `AGENTS.md`, `CLAUDE.md` and `docs/CONSTITUTION.md` are protected. Doc changes there go in their own PR with a
  `## Protected File Changes` section, after the owner approves.
- The CSP uses per-request nonces. Instagram embeds would need `frame-src`/`script-src` changes, so v1 links to
  posts instead of embedding them (§7.4).

## 6. Decided design

### 6.1 Data model (new migration, additive)

**`cities`**: `slug` (pk: `singapore`, `johor-bahru`), `name`, `country` (`SG`/`MY`), `currency` (`SGD`/`MYR`),
`sort_order`. Seeded with the two cities.

**`cafes`**

- `id`, `slug` (unique, readable, e.g. `kurasu-singapore-oxley`), `name`, `city_slug` (FK), `area` (free text
  neighbourhood such as "Tanjong Pagar")
- `address`, `lat`, `lng`
- `instagram_handle`, `website_url` (https only)
- `status` (`pending|approved|rejected`), `added_by`, `review_note`, timestamps
- Public reads approved rows, plus the adder's own. Same moderation pattern as products: a signed-in user can add
  a pending café, and an admin approves it. Audited.

**`drinks`**

- `id`, `cafe_id` (FK), `name` (as on the menu, e.g. "Hojicha Latte")
- `base` (`hojicha|matcha`)
- `style` (`latte|straight|iced_latte|float|other`): drinks only. Desserts are out of scope pending §9 Q3.
- `serving` (`hot|iced|both`), `price` (numeric), `currency` (from the café's city), `photo_url`, `photo_credit`
- `tea_product_id` (nullable FK to `products`: "tea used here", when known)
- `status`, `added_by`, timestamps. Unique on (`cafe_id`, `name`). Moderation, RLS and audit as for cafés.

**`reviews` changes**

- `product_id` becomes nullable, and a new `drink_id` FK is added. A CHECK requires exactly one of the two.
  Existing rows are untouched. Every review consumer that assumes a product is updated (see §7.1).
- New nullable `instagram_url`: must match `https://www.instagram.com/(p|reel)/…`, validated in Zod and with a DB
  CHECK. Only a trusted taster can set it (enforced by RLS/trigger).
- New `disclosure` (`none|invited|gifted|paid`), default `none`. Shown on every review that isn't `none`.
- Drink reviews reuse `stars`, `notes`, `photo_url`, `flavor_notes`, `sweetness`, `body`, `bitterness` and
  `tasted_on`. They add `tea_strength` (1–5, how much the tea comes through the milk) and `roast` (1–5, hojicha
  only). The brewing fields (`dose_g`, `water_ml`, …) stay for packaged-tea reviews only.

**`profiles` changes**: `is_trusted_taster boolean default false` (only an admin can set it; the user's own update
policy must not allow it), `instagram_handle`, `bio` (≤ 280 chars).

**`drink_ratings` view**: per drink, `taster_avg`, `taster_count`, `community_avg`, `community_count`. "Taster" means
the review's author is a trusted taster _at read time_. The view follows §6.4. Add a `cafe_ratings` view the same
way, rolled up over the café's drinks.

### 6.2 Pages and routes

- **`/cafes`**: map and list of approved cafés, with a city switch (SG / JB, remembered in a cookie), an area filter
  and a "has taster review" filter. This reuses the existing tea-map widget and shop explorer patterns.
- **`/cafes/[slug]`**: the café page and a primary IG landing.
  - Shows name, area, address, a map pin, IG handle and website.
  - Lists its drinks, each with its taster score and community score.
  - Shows the latest taster reviews with their IG post links.
  - Has an "Add a drink" button and an OG image.
- **`/cafes/[slug]/[drink]`** (a drink slug within the café): the drink page and the other IG landing.
  - The header shows the drink, café, price, base, style and serving.
  - The **Taster score** block comes first: each taster's stars, notes, disclosure badge and "See the post" link.
  - The community score and reviews come below it.
  - "Rate this drink" opens the existing rating dialog in drink mode.
  - Shows "Tea used here" (a link to the product) when it's set, a "Similar drinks" list (same style and base,
    same city) and an OG image.
- **`/tasters`**: trusted tasters with avatar, bio, IG handle, review count and latest review.
- **`/u/[id]`** (existing): adds bio, IG handle, a trusted-taster badge, and drink reviews alongside tea tastings.
- **`/top`**: lists are rebuilt for drinks: per city × style (e.g. "Best hojicha lattes in Singapore"). A drink
  qualifies with ≥1 taster review **or** ≥3 community reviews, so the page is no longer a dead end. The existing
  packaged-tea lists move under "At home".
- **`/`** (home):
  - The H1 and subhead carry the new line.
  - A city switch.
  - A "Latest from our tasters" rail (drink cards with the taster score and café).
  - A "Top hojicha lattes in <city>" rail, a cafés-near-you style list (by area, without geolocation in v1), and
    one small "Brew it at home" link row.
  - The old packaged-tea rails and the repeated secondary links go.
- **Short IG-bio-friendly URLs**: `/c/<slug>` redirects to `/cafes/<slug>` (308), so post captions stay short.

### 6.3 Navigation

- **Navbar:** Cafés, Top, Tasters, At home (a menu: Teas, Learn, Regions), search, notifications, account. The
  "Log a tasting" control becomes a labelled button that opens the rating dialog.
- **Mobile tab bar:** Home, Cafés, Log, Top, Journal.
- **Footer:**
  - Keeps Regions, Tea supply, Learn and Shops (renamed "Tea shops", for maker stores).
  - Drops "Sell on Matchoji" and replaces "A hobby project" with a short "How we rate" link.
- Journal stays reachable from the account menu and the tab bar.

### 6.4 Trust rules (the anti-goal guard)

- The taster score and community score are computed and shown **separately, never blended**.
- Every review with `disclosure` ≠ `none` shows a visible badge ("Gifted", "Paid partnership", "Invited") on every
  surface where the review appears.
- How disclosed reviews count toward the taster score is §9 Q1. The proposed default: they count, they're labelled,
  and the drink page shows "n of m taster reviews were gifted/paid".
- Top lists rank by taster score when one exists, else by community score, and never by recency of paid posts.
- A "How we rate" page (`/about/how-we-rate`) explains the tiers and disclosure in plain words.

### 6.5 Rating flow

- The existing `LogTastingDialog` gains a first step: "A café drink" or "A tea I brewed".
- **Drink path:** search approved cafés, or add one (pending), then search that café's drinks or add one (pending),
  then rate. The form shows the drink fields from §6.1.
- **Trusted tasters only:** an "Instagram post link" field and the disclosure select are shown and required.
  Community users don't see them; their disclosure defaults to `none`.
- **Tea path:** unchanged.

### 6.6 Admin

`/admin` adds tabs:

- Cafés and Drinks queues: approve or reject, plus edit fields and merge duplicates, reusing the products patterns.
- Tasters: search a profile and grant or revoke the badge (audited).

### 6.7 Cleanup sweep (from the audit)

- **Hide Phase 3 surfaces:** remove `/sell` from navigation, the "Sell it on Matchoji" link and the empty "Where to
  buy" section on tea pages. `/sell` itself returns `notFound()` behind one flag in `src/lib/constants`. The tables
  and code stay (commerce is parked, not dropped). See §9 Q4.
- **Empty chrome hides:** tea pages hide "Where to buy" and the stock panel when they have no data. "Not yet rated"
  gets one quiet line, not a badge on every card.
- **Fix the navbar mismatch:** the icon labelled "Log a tasting" currently links to /explore as "Search teas".
- **Reframe copy:**
  - Home, `/offline` (no longer tea-only) and the footer.
  - Explore becomes "Teas" under At home, and its grade filter groups matcha grades apart from hojicha grades.
- **Shop pages:** `/shops` becomes "Tea shops" (maker stores and stockists). The US Kettl café rows stay as tea
  shops; they aren't SG/JB cafés.
- **Docs:**
  - PRODUCT.md is rewritten for the new positioning; it isn't protected.
  - The design spec gets the pointer.
  - AGENTS.md "Phase 1 only" and the CONSTITUTION phase rule are updated in a separate protected-file PR, once the
    owner approves.
- **Route constants:** `PAGE_ROUTES` gains the new routes, and nav and footer read from it.

### 6.8 Seed data

- **The owner provides the cafés:** each with name, address, IG handle, and the IG post URLs with their scores.
  They're inserted by a migration or by the admin forms.
- **The owner's profile** is set as a trusted taster with their IG handle.
- **No AI-generated or guessed seed data.** Coordinates come from the café's address via a stated, attributed
  source, or are entered by hand.

## 7. Notes for the builder

### 7.1 Known blast radius of `reviews.product_id` becoming nullable

Journal, stats and year-in-tea, taste match, discovery/top lists, similar teas, social feed, notifications, share
cards, JSON-LD, account export and the admin review queue all read reviews joined to products. Each must either
filter to `product_id is not null` or handle drink reviews deliberately:

- The journal and feed show both kinds.
- Taste match and year-in-tea stay tea-only in v1 (builder may extend later).
- The account export includes both.

### 7.2 Left to the builder

- Exact slugs, component layout, map clustering, and the visual design (use the existing design system and
  `impeccable` for UI passes).
- How the café-name search is indexed.
- The choice between a view and a function for the ratings rollups.
- How to share the moderation code between products, cafés and drinks.

### 7.3 Suggested build order (the plan will refine it)

1. Schema migration, types, services and fallbacks.
2. Admin tools.
3. Café and drink pages, plus `/c/` redirect and OG cards.
4. Rating flow in drink mode, plus taster fields.
5. Profiles, `/tasters` and "How we rate".
6. Home, nav, top lists and city switch.
7. Cleanup sweep.
8. Protected docs PR.

Slices touching the same files run one after another.

### 7.4 Instagram

Link to the post with an "See the post on Instagram" button. No embeds in v1 (CSP and third-party script).

### 7.5 Calls made after the builder check (orchestrator's calls; the owner can override)

1. **One rating per person per drink.** Scores count only each person's latest review of a drink, the same rule
   tea ratings follow (`internal.latest_reviews`). Add a drink-keyed variant so a re-log can't move the score or
   pad the "≥3 community reviews" threshold. The journal still keeps every tasting.
2. **Trusted tasters are always public.** Granting the badge sets the profile public. While the badge is held, the
   profile can't switch to private, so a taster score always has visible reviews behind it. Community reviews from
   private profiles count in the community score but aren't listed, as today.
3. **The taster flag is stored on the review when it's written.**
   - `reviews.by_trusted_taster` (boolean, set by trigger from the author's profile at insert) replaces the
     read-time check in §6.1.
   - Revoking a badge doesn't rewrite history.
   - Reviews written before a grant stay community reviews.
   - A trigger requires `instagram_url` and an explicit `disclosure` when `by_trusted_taster` is true.
4. **Drink reviews join the social layer.**
   - Reactions and notifications fire for drink reviews too.
   - `notifications.product_id` becomes nullable, a `drink_id` is added, and a CHECK requires exactly one.
   - Café and drink merges each get an RPC like the product merge, repointing reviews, drinks and
     `tea_product_id`.
5. **Pending drinks can be rated.** The person who added a pending drink can rate it, mirroring
   `can_engage_product`. The rating views and lists count approved drinks at approved cafés only.
6. **A light anti-spam cap.** Each user may hold at most 10 pending cafés and 20 pending drinks; inserts past that
   are refused by RLS. Rate limits beyond this wait for real abuse.
7. **Module boundary.**
   - One new feature module, `src/features/cafes/`, owns cafés, drinks, their pages, pickers, services and rating
     views.
   - The dependency runs `cafes → reviews` only: cafés imports review list and form pieces from `reviews/index.ts`.
   - The dialog's "café drink" step is a `cafes` component. The widget layer (`src/components/widgets/`) composes
     it into the log dialog, so `reviews` never imports `cafes`.
8. **Stored, immutable slugs.**
   - `drinks.slug` is unique per café and set at insert; renames don't change slugs.
   - A merged or rejected café or drink keeps its slug and redirects to the surviving page, or to the café, so
     posted IG links never 404.
9. **Prices aren't compared across cities.** Lists and "Similar drinks" are per city, so no currency conversion is
   needed.
10. **City selection.** A `?city=` query parameter sets the city and wins over the cookie. Café and drink pages carry
    their own city. The home page, `/cafes` and `/top` render dynamically.
11. **Migrations.**
    - One migration file holds all schema changes, so the `reviews` CHECK, the taster triggers and the profile RLS
      land together.
    - The owner applies it before the first code slice that reads the new schema is merged.
    - Code falls back cleanly for missing _tables_ only. A missing-column fallback is out of scope; the merge-order
      rule covers it.

## 8. Success

- The owner can post on IG with a link that opens a café or drink page showing their score, notes and post link.
- A visitor can find the best-rated hojicha latte in Singapore or JB in two taps from home.
- No page a visitor can reach from navigation is a dead end or an empty shell.
- CI green, every new route tested (401/200/error per constitution), and every migration applied by the owner and
  verified on production.

## 9. Owner decisions (2026-11-10)

1. **Paid and gifted reviews count.** They count toward the taster score and toward `/top`. Each one is labelled,
   and every drink page and `/top` card shows "n of m taster reviews were gifted/paid".
2. **Anyone signed in can add cafés and drinks.** New ones are held for admin approval, with the per-user pending
   caps in §7.5.
3. **Drinks only.** Desserts are out of scope for v1.
4. **Phase 3 surfaces are hidden behind a flag.** `/sell` and "Where to buy" are hidden, and the code and tables stay.

Still open; these don't block the build:

5. **Seed list.** The owner will supply foodcnl cafés and post links for launch data.
6. **Domain.** `matchoji.vercel.app` or a custom domain for IG captions. It only affects copy and OG URLs, which
   read from the site URL constant.
