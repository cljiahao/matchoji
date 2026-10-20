# Tasting Journal redesign — design

Status: approved to build by the user ("just start, use your best judgement"), 2026-10-21.
Calls marked _(builder's call)_ were made without the user and are open to change.

## Intent

The shipped Phase 1 UI works but reads as plain: one grey ground, small type, text-only
cards, and a rating flow that captures stars and a sentence. The user wants it to feel like
Vivino (a score you trust, a taste profile, what other people noticed) and a coffee tracker
(log how you made it, keep a personal journal), while staying minimalist.

The why: Matchoji's value is the record. A tasting log is only worth returning to if each
entry captures enough (what it tasted like, how it was made) and the app gives that record
back as something useful (a product's consensus profile, your own journal and patterns).

## Goals

1. Richer tasting entries: flavour notes, a four-attribute taste profile, preparation details.
2. Product pages that summarise the crowd: big score, rating distribution, average taste
   profile, most-noticed notes, how people prepare it, review photos.
3. A personal journal: your tastings over time, simple stats, and a "Want to try" list.
4. Discovery that scales past a handful of products: search, sort, region filter.
5. A visual refresh that removes the plainness without adding decoration.

## Non-goals

- Marketplace, prices, vendors, buying (Phase 3/4, per PRODUCT.md and the constitution).
- Social graph: following, feeds of friends, likes, comments.
- Label scanning, barcode lookup, external product databases.
- A dark-mode-specific design pass (tokens keep working; no bespoke dark art direction).

## Anti-goals (would make this a failure even if it works)

- Decoration standing in for content: gradients, glass, illustrations of tea fields, emoji.
- A long, intimidating form. Stars must still be a one-tap log; everything else is optional
  and collapsed until wanted.
- Invented data: no fake reviews, counts, or "trending" claims on an empty catalogue.

## Constraints

- Stack unchanged: Next.js 16 App Router, Supabase (Postgres, Auth, Storage), shadcn/ui,
  TanStack Query, React Hook Form + Zod, Vitest + RTL. No new runtime dependencies unless a
  task cannot reasonably be done without one.
- Supabase schema changes ship as new numbered SQL migrations the user runs by hand.
- `Product` stays seller-agnostic (constitution §2). New tables attach to products/users.
- Every boundary validated with Zod; RLS on every new table.
- CI gates: changed-line coverage ≥80%, changelog, README freshness, comment hygiene.

## Visual direction — "The Tasting Ledger", deepened _(builder's call)_

Keep the established world (DESIGN.md): Lato only, jade = matcha, amber = hojicha, category
colour is data, Operate mode. Change what makes it plain:

- **Ground and surfaces.** Page ground becomes a faint paper tone (`#f6f4ef`); cards and
  panels are white. Depth comes from the two-tone surface, not shadows. DESIGN.md's
  "neutral ground" rule is replaced; this is the one durable system change.
- **Scale and hierarchy.** A real type ramp: page titles 32/40, section titles 20, and a
  score numeral (Lato 900, tabular, 48px on product pages, 20px on cards) as the Vivino-style
  signature. Labels in small caps-height uppercase tracking are banned (no eyebrows); section
  titles carry hierarchy alone.
- **Category colour at region scale.** Product cards drop the 4px left spine. Instead the
  card's image well is the product photo or, without one, a field tinted with the category
  colour at low strength carrying a single drawn leaf mark. Badges, star fill, taste-profile
  bars and active filters keep the solid category colour.
- **Signature visual: the taste profile.** Four horizontal bars (sweetness, umami,
  bitterness, body) on a 1–5 scale, filled in the category colour. Same component reads
  one review's profile and a product's average.
- **Motion.** One moment: taste-profile bars and the rating histogram grow from zero on
  first view (200ms, ease-out, respects `prefers-reduced-motion`). Nothing else animates
  beyond hover/press feedback.
- **Shell.** Top bar: wordmark, Discover and Journal links, "Log a tasting" button, account.
  On narrow screens the links collapse into the account menu; "Log a tasting" stays visible.

## Features

### 1. Tasting entry (extends the review)

Fields, all optional except stars:

- Stars 1–5 (existing).
- Flavour notes: multi-select chips from a per-category vocabulary, up to 6.
  - Matcha: umami, grassy, creamy, sweet, vegetal, marine, nutty, floral, bitter, astringent.
  - Hojicha: roasty, caramel, nutty, chocolate, woody, smoky, sweet, earthy, toasted rice, malty.
    _(builder's call on the lists; stored as plain text slugs so lists can change later.)_
- Taste profile: sweetness, umami, bitterness, body — each 1–5 via a five-step segmented control.
- Preparation: method (usucha, koicha, latte, iced, cold brew, steeped leaf, other), dose in
  grams, water in ml, water temperature in °C. Collapsed under "How you made it".
- Tasted on (date, defaults to today), notes, photo (existing).

The form opens with stars and notes visible; flavour notes and taste profile sit in a second
group; preparation is collapsed. The sign-in draft (sessionStorage) carries every new field.

### 2. Product page

Top: image well, name, category badge, brand · grade · region, big score numeral with stars
and review count, "Want to try" toggle (signed-in; signed-out goes through sign-in).

Then, only when there are reviews:

- Rating distribution: five bars, 5★ to 1★, with counts.
- Taste profile: averages of the four attributes over reviews that set them, with the number
  of reviews contributing.
- Most noticed: the top flavour notes with counts.
- How people make it: most common method, median dose, water and temperature where at least
  two reviews recorded them.
- Photos: a strip of review photos.

Then reviews (existing paging/read-more), each showing its notes chips, profile (compact) and
a one-line prep summary ("Usucha · 2g · 70ml · 80°C"), and the rate form.

Aggregation runs in the app over the product's reviews (already fetched in full), as pure,
unit-tested functions. Revisit with SQL views if a product passes a few hundred reviews.

### 3. Journal (`/journal`, signed-in)

- Stats: tastings logged, average rating, matcha/hojicha split (one bar in both colours),
  your three most-used notes.
- Timeline: your tastings newest first, grouped by month, each linking to its product.
- Want to try: products you saved, each removable.
- Signed-out: a short explanation and the sign-in button. Empty: first-tasting CTA.

### 4. Discover

- Search box (name or brand), category tabs, region filter, sort: Top rated (default), Most
  reviewed, Newest. All state in the URL (`?q=&category=&region=&sort=`), server-rendered.
- Card: image well, name, brand, region, score numeral + stars + count.
- Empty and no-results states are distinct.

### 5. Want to try

`wishlist` table (user, product, created_at). Toggle on product page and card; list in the
journal.

## Data model changes (migration `20261021000000_tasting_journal.sql`)

- `reviews` gains: `flavor_notes text[] not null default '{}'` (≤ 6 entries),
  `sweetness`, `umami`, `bitterness`, `body` (`smallint`, 1–5, nullable),
  `prep_method text` (checked against the method list), `dose_g numeric(4,1)` (0–50),
  `water_ml integer` (0–1000), `water_temp_c integer` (0–100), `tasted_on date not null
default current_date`.
- `wishlist (user_id uuid → profiles, product_id uuid → products, created_at, pk(user_id, product_id))`,
  RLS: owner-only select/insert/delete.
- Reviews stay publicly readable; the journal reads the signed-in user's own rows.

## Delivery

Three PRs, each shippable on its own, in this order:

1. **Visual refresh + discover**: tokens, shell, new card, search/sort/region filter.
2. **Tasting entry + product page**: migration (reviews columns), form, aggregates, review display.
3. **Journal + want to try**: migration (wishlist), `/journal`, toggles.

The migration for 2 and 3 is one file shipped with PR 2, so the user runs SQL once; PR 3's
code only uses it. _(builder's call)_

## Left to the builder

Exact spacing values, component decomposition, copy wording beyond what is above, the leaf
mark's drawing, and test structure — within DESIGN.md (updated in PR 1) and the craft floor.

## Flagged, not addressed here

The constitution requires "All mutations write to an audit log"; the app has no audit log
today (Phase 1 shipped without one). This redesign does not add one. Raise separately.
