---
version: 1
slug: 'src-app-public-page-tsx'
primary_target: 'src/app/(public)/page.tsx'
related_targets:
  [
    'src/app/(public)/explore/page.tsx',
    'src/app/(public)/products/[id]/page.tsx',
    'src/app/(public)/journal/page.tsx',
  ]
---

# Vivino-style app shell (home, Explore, product, journal)

Scope: every public surface. Mode: Operate (browse, compare, rate). Audience: matcha and
hojicha drinkers choosing what to buy next and logging what they tried. Task: find a tea,
read what people noticed, rate it in one tap. Constraint: no invented ratings or claims;
writes need sign-in. Pinned by the user: work and look like Vivino.

## Direction contract

THESIS: Vivino's shop-shelf grammar played straight for tea: product-led tiles, big score
numerals, shelves, a filter rail, and one-tap rating. Refuses the form-first ledger.

OWN-WORLD: white page; products on warm grey #f4f3f0 tiles (16px radius) or drawn tins in
jade #5c7a4f / amber #8f6224; deep matcha green #2f5233 for actions; pill buttons and
chips; Figtree 400–800; score numeral 800 tabular; hairline #e6e4df; category-tinted hero
band; flavour families in their own earthy colours.

STORY: the visitor sees at once this is about matcha and hojicha, browses shelves or
searches, opens a tea, reads its taste sliders and flavour cards, and taps a star; signed
out, that tap asks them to join.

FIRST VIEWPORT: home: centred 60px heading, line under it, 56px search pill, two 144px
category circles holding tins; first shelf below the fold edge. Product: tinted band with
the tile left, brand, 48px name, chips, 60px score, "Rate it" stars, Want to try.

FORM: canon (user-pinned Vivino), no concept-seed roll; seed key: none (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
