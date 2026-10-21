# Vivino-style redesign — design

Status: the user asked to "study vivino and redo it" and to skip questions, 2026-10-22.
Calls marked _(builder's call)_ were made without the user and are open to change.

## Intent

The tasting-journal redesign (2026-10-21) added the right data but kept a rigid, form-first
look: a paper ledger, a toolbar, an empty box, black buttons. Nothing on the first screen says
"matcha and hojicha". The user wants the app to work and feel like Vivino: sleek, minimal,
clean, product-led, and obviously about tea.

## What Vivino does (studied on vivino.com, 2026-10-22)

- **Product-led everywhere.** Every card leads with the bottle on a soft grey rounded tile;
  producer in small grey above the bold name; a star, the score and "(627 ratings)" below.
- **Home is a shelf store.** A centred heading, category circles with product imagery
  (Red, White, Rosé…), then horizontal shelves ("This week's most loved picks",
  "Bestsellers in Singapore") that scroll sideways.
- **Explore is a filtered list.** Left filter rail (types as checkboxes, rating, price),
  "Showing 1-24 of 4697 wines", a sort select, and wide rows: bottle left, producer and name,
  region with a flag, big score and stars on the right.
- **The wine page.** A tinted hero band: bottle left; producer, big name, linked region and
  style chips; a big score numeral with small stars and "30 ratings"; text actions
  ("Add to Wishlist"). Then "Facts about the wine" as an icon table, "Community reviews"
  (cards with a star-score pill, reviewer and date; the histogram and "Add your own rating"
  stars on the right), and "What does this wine taste like?": bipolar sliders
  (Light–Bold, Dry–Sweet, Soft–Acidic) with a marker, and flavour families as coloured cards
  ("Citrus, lemon, lime · 27 mentions of citrus notes").
- **Rating needs an account.** Tapping a star while signed out opens "Join Vivino | Log in"
  immediately, before any form.

## Goals

1. Gate every write behind sign-in the Vivino way: a sign-in dialog opens the moment a
   signed-out visitor taps a star, "Log a tasting" or "Want to try". No signed-out form
   filling, no parked drafts.
2. One-tap rating on the product page: tap a star in "Add your rating" and the full tasting
   form opens in a dialog with that star already set.
3. A home page that is a shelf store for tea: heading, search, Matcha / Hojicha circles,
   shelves of top-rated matcha, top-rated hojicha and newest.
4. An explore page (`/explore`) with a filter rail and wide result rows, carrying the existing
   search, category, region and sort params.
5. A product page in Vivino's order: hero band, taste structure, flavour families, facts,
   community reviews with the histogram and rating stars, how people make it.
6. A visual world that is white, clean and tea-led, with authored tin artwork standing in for
   missing product photos, so an empty catalogue still looks like a tea app.

## Non-goals

Marketplace, prices, buying, vendors (Phase 3/4). Social features (likes, comments, follows).
Label scanning. New database columns: everything here uses the existing schema.

## Anti-goals

- Fake data: no invented ratings, counts, "trending" or "best pick" claims.
- A long form on the page. The full tasting form only appears after a star tap.
- Decoration in place of content: no gradients, glass, or illustrations of tea fields.

## Visual direction _(builder's call)_

Pinned by the user: Vivino's grammar played straight, translated to tea.

- **Ground and surfaces.** White page. Product tiles on a soft warm grey (`#f4f3f0`),
  rounded 16px. Hero bands tinted with the product's category colour at low strength
  (Vivino's blush band).
- **Brand colour.** A deep matcha green (`#2f5233`) for primary actions and the wordmark, as
  Vivino uses green for actions. Jade and amber stay as category data: stars, badges, sliders,
  flavour cards.
- **Type.** Figtree for everything (400–800). Score numeral 800, tabular.
- **Product art.** Authored SVG tins, one per category (matcha: green tin with a leaf band;
  hojicha: amber tin with a roasted-leaf band), shown inside the grey tile whenever a product
  has no photo. Circles on the home page use the same tins.
- **Signature move.** Taste structure as Vivino's bipolar sliders: Light–Full (body),
  Dry–Sweet (sweetness), Mild–Savoury (umami), Smooth–Bitter (bitterness), each a hairline
  track with a category-coloured marker at the average.
- **Shape language.** Pill buttons, pill chips, 16px tiles, hairline dividers, no resting
  shadows except the dialog.

## Pages

- **Navbar:** logo mark + wordmark, a search pill (submits to `/explore?q=`), Explore and
  Journal links, a green "Log a tasting" pill, and Sign in / account.
- **Home `/`:** heading "Find your next matcha or hojicha", one line under it, a large search
  pill; two category circles (Matcha, Hojicha) linking to `/explore?category=`; shelves
  "Top-rated matcha", "Top-rated hojicha", "Newly added", each with "See all". With an empty
  catalogue the shelves give way to one invitation to log the first tasting.
- **Explore `/explore`:** filter rail (category, region, sort) left from `lg`, above the list
  below it; "Showing N teas"; wide rows (tile, brand, name, grade · region, top notes, score,
  stars, count, want-to-try).
- **Product `/products/[id]`:** as in Vivino's wine page, above. "Add your rating" stars sit
  beside the histogram in Community reviews and in the hero.
- **Journal `/journal`:** same world: heading, stats, your tastings as rows with the tea tile
  and your stars, Want to try.

## Left to the builder

Spacing, exact copy beyond the above, the tins' drawing, component decomposition, tests.
