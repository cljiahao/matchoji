---
name: Matchoji
description: Rate and discover hojicha and matcha, one cup at a time.
colors:
  matcha-green: '#2f5233'
  on-matcha-green: '#ffffff'
  matcha-jade: '#5c7a4f'
  hojicha-amber: '#8f6224'
  on-category: '#ffffff'
  ink: '#101010'
  page-white: '#ffffff'
  shelf-tile: '#f4f3f0'
  muted-ink: '#6b6862'
  hairline: '#e6e4df'
  field-edge: 'oklch(0.8 0 0)'
  focus-ring: 'oklch(0.35 0 0)'
  empty-star: '#d4d4d4'
  destructive: 'oklch(0.577 0.245 27.325)'
  tin-matcha-body-1: '#5c7a4f'
  tin-matcha-shade-1: '#4d6942'
  tin-matcha-lid-1: '#3d5634'
  tin-matcha-body-2: '#6f8c58'
  tin-matcha-shade-2: '#5e7a4b'
  tin-matcha-lid-2: '#2f4a2a'
  tin-matcha-body-3: '#4a6741'
  tin-matcha-shade-3: '#3e5837'
  tin-hojicha-body-1: '#8f6224'
  tin-hojicha-shade-1: '#7a531d'
  tin-hojicha-lid-1: '#5f4015'
  tin-hojicha-body-2: '#a3712f'
  tin-hojicha-shade-2: '#8c6127'
  tin-hojicha-lid-2: '#4a3110'
  tin-hojicha-body-3: '#74501d'
  tin-hojicha-shade-3: '#634418'
  tin-label-1: '#f5f1e6'
  tin-label-2: '#f2efe7'
  tin-label-3: '#faf6ec'
  flavor-green: '#6f8f4e'
  flavor-savoury: '#3f6b5c'
  flavor-sweet: '#b98a45'
  flavor-floral: '#a77897'
  flavor-bitter: '#6b6a45'
  flavor-roast: '#8a5a2b'
  flavor-nutty: '#7a6448'
typography:
  display:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '3.75rem'
    fontWeight: 700
    lineHeight: 1
    letterSpacing: '-0.025em'
  headline:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '3rem'
    fontWeight: 700
    lineHeight: 1
    letterSpacing: '-0.025em'
  section-title:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 700
    lineHeight: 1.333
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '1rem'
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 600
    lineHeight: 1.33
  tab-label:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '11px'
    fontWeight: 600
  score-lg:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '3.75rem'
    fontWeight: 800
    lineHeight: 1
    letterSpacing: '-0.025em'
    fontFeature: '"tnum"'
  score-md:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '1.875rem'
    fontWeight: 800
    lineHeight: 1
    letterSpacing: '-0.025em'
    fontFeature: '"tnum"'
  score-sm:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 800
    lineHeight: 1
    letterSpacing: '-0.025em'
    fontFeature: '"tnum"'
  wordmark:
    fontFamily: 'Figtree, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 800
    letterSpacing: '-0.025em'
rounded:
  field: '10px'
  row: '12px'
  tile: '16px'
  panel: '24px'
  pill: '9999px'
spacing:
  gutter: '24px'
  shelf-gap-mobile: '16px'
  shelf-gap: '24px'
  card-pad: '20px'
  shelf-stack: '56px'
  section-stack: '64px'
  container: '1184px'
components:
  button-primary:
    backgroundColor: '{colors.matcha-green}'
    textColor: '{colors.on-matcha-green}'
    typography: '{typography.body-small}'
    rounded: '{rounded.pill}'
    padding: '8px 16px'
    height: '36px'
  button-primary-hover:
    backgroundColor: 'color-mix(in oklab, #2f5233 90%, transparent)'
  button-outline:
    backgroundColor: '{colors.page-white}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    padding: '8px 16px'
    height: '36px'
  button-outline-hover:
    backgroundColor: '#f5f5f5'
  button-icon-compact:
    backgroundColor: '{colors.page-white}'
    rounded: '{rounded.pill}'
    size: '32px'
  search-pill-lg:
    backgroundColor: '{colors.page-white}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.pill}'
    padding: '0 20px 0 52px'
    height: '56px'
  search-pill:
    backgroundColor: '{colors.page-white}'
    typography: '{typography.body-small}'
    rounded: '{rounded.pill}'
    padding: '0 16px 0 40px'
    height: '40px'
  chip-category-matcha:
    backgroundColor: '{colors.matcha-jade}'
    textColor: '{colors.on-category}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: '2px 10px'
  chip-category-hojicha:
    backgroundColor: '{colors.hojicha-amber}'
    textColor: '{colors.on-category}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: '2px 10px'
  chip-meta:
    backgroundColor: '{colors.page-white}'
    textColor: '{colors.ink}'
    typography: '{typography.body-small}'
    rounded: '{rounded.pill}'
    padding: '2px 10px'
  chip-note:
    backgroundColor: '{colors.shelf-tile}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: '2px 10px'
  product-tile:
    backgroundColor: '{colors.shelf-tile}'
    rounded: '{rounded.tile}'
  category-circle:
    backgroundColor: 'color-mix(in oklab, #5c7a4f 15%, transparent)'
    rounded: '{rounded.pill}'
    size: '144px'
  flavor-card:
    backgroundColor: '{colors.page-white}'
    rounded: '{rounded.tile}'
    padding: '12px 16px'
  review-card:
    backgroundColor: '{colors.page-white}'
    textColor: '{colors.ink}'
    rounded: '{rounded.tile}'
    padding: '{spacing.card-pad}'
  muted-panel:
    backgroundColor: '{colors.shelf-tile}'
    rounded: '{rounded.panel}'
    padding: '64px 24px'
  dialog:
    backgroundColor: '{colors.page-white}'
    rounded: '{rounded.panel}'
    padding: '32px'
  nav-bar:
    backgroundColor: 'rgba(255, 255, 255, 0.95)'
    height: '64px'
  mobile-tab-bar:
    backgroundColor: 'rgba(255, 255, 255, 0.95)'
    typography: '{typography.tab-label}'
---

# Design System: Matchoji

## Overview

**Creative North Star: "The Tea Shop Shelf"**

Matchoji plays Vivino's shop-shelf grammar straight, for tea. The page is plain white; every product sits on its own warm grey tile the way a tin sits on a shop shelf, and when no photograph exists a flat-drawn tin in the tea's own colours stands in for it. Shelves scroll sideways, a filter rail sits on the left of Explore, and the product page opens on a category-tinted band carrying the tile, the name, a big score numeral and a one-tap star row.

The world is product-led and numeral-led. Type is a single sans (Figtree) doing all the work through weight: 700 for headings and product names, 800 for the score numeral and wordmark. Colour has three jobs and keeps them separate: deep matcha green for actions, jade and amber for category data, and an earthy set of flavour-family colours for the flavour cards. Everything interactive is a pill. Surfaces are flat; depth comes from tile against white, not from shadow.

Density is relaxed and browsable: wide shelves, 24px gutters, generous stacks between sections. Motion is limited to two data animations (bars grow, taste markers slide) and small hover lifts.

**Key Characteristics:**

- White page, warm grey shelf tiles (16px radius), flat-drawn tins when there is no photo.
- One sans, Figtree, weight as hierarchy; tabular 800 numerals for scores.
- Deep matcha green for actions only; jade and amber for category data only.
- Every button, chip, search field and avatar is a full pill or circle.
- Flat surfaces, hairline borders, no decorative shadow.

## Colors

A white shop with one deep green for actions, two category colours treated as data, and a small earthy palette reserved for flavour.

### Primary

- **Deep Matcha Green** (matcha-green): the action colour. Primary buttons ("Log a tasting"), the wordmark, "See all" and "Read more" links, the active mobile tab, the selected radio dot in the filter rail, and the Log button disc in the tab bar. Hover is the same green at 90% opacity.

### Secondary

- **Jade** (matcha-jade): the matcha category. Category chip fill, filled stars, taste-slider markers, rating-distribution bars, the matcha share of the journal split bar, and the tint behind matcha category circles (15%) and the product hero band (8%).
- **Amber** (hojicha-amber): the hojicha category, in exactly the same roles as jade. Both carry white text at WCAG AA.

### Tertiary

- **Flavour family colours** (flavor-green, flavor-savoury, flavor-sweet, flavor-floral, flavor-bitter, flavor-roast, flavor-nutty): each flavour family's card header is a solid band in its own colour carrying a white line icon in a 20% white disc. These are flavour colours, not category colours, and never appear outside the flavour cards.
- **Tin tones** (tin-matcha-_, tin-hojicha-_, tin-label-*): the drawn tin's body, right-side shade, lid and ink, three variants per category plus three cream labels. A stable hash of the product id picks the variant, so neighbouring tins on a shelf differ while each product always draws the same tin. Matcha tones stay in the jade family, hojicha tones in the amber family.

### Neutral

- **Ink** (ink): all body text and headings.
- **Page White** (page-white): page, cards, dialogs, nav (at 95% with backdrop blur), meta chips on the hero band.
- **Shelf Tile** (shelf-tile): product tiles, the muted fill of empty-state panels, the journal stats strip, slider and bar tracks, note chips, and the footer.
- **Muted Ink** (muted-ink): brands above product names, rating counts, helper text, inactive nav links.
- **Hairline** (hairline): every 1px border: nav and tab-bar edges, search pill, flavour and review cards, review footers.
- **Field Edge** and **Focus Ring**: form-field strokes and the single 2px focus outline (offset 2px), set to clear 3:1.
- **Empty Star** (empty-star): unfilled stars in displays and the rate-it row.

### Named Rules

**The Three Jobs Rule.** Green acts, jade and amber classify, flavour colours describe flavour. A colour never borrows another's job: no green category data, no jade buttons, no flavour colours outside flavour cards.

**The Category Is Data Rule.** Every jade or amber use comes from one category style map, so a tea's chip, stars, slider marker, bars, tint and band always agree.

## Typography

**Display Font:** Figtree (with sans-serif)
**Label/Mono Font:** Geist Mono is loaded but not used for any visible role.

**Character:** One friendly geometric sans, used the way a shop app uses it: large, tight-tracked bold headings and heavy tabular numerals, plain regular body.

### Hierarchy

- **Display** (700, 60px, line-height 1, -0.025em; 36px on phones): the home heading only, centred, balanced.
- **Headline** (700, 48px, -0.025em; 36px on phones): the product name on the hero band.
- **Section Title** (700, 24px, -0.025em): shelf titles and product-page section heads ("What does it taste like?").
- **Title** (700, 16px, line-height 1.375): product names on shelf cards, clamped to two lines, underlined on hover.
- **Body** (400, 16px, 1.5): review text (capped at prose width, about 65ch) and intro lines (18px on home).
- **Body Small** (400–600, 14px): brands, rating lines, filter options, nav links (600), helper text.
- **Label** (600, 12px): category chips and note chips; 11px for mobile tab labels.
- **Score** (800, tabular, -0.025em, line-height 1): 60px on the product hero, 30px in stats, 20px small.

### Named Rules

**The Numeral Outranks The Stars Rule.** Wherever an average appears with stars, the numeral is larger and heavier (800, tabular) and sits first; stars fill fractionally so they always agree with it.

**The Weight Is Hierarchy Rule.** Hierarchy comes from size and weight in Figtree alone. No second display face, no uppercase tracked labels.

## Layout

A centred container (1184px max) with 24px side gutters on every surface. Home opens with a centred hero (48px top on phones, 80px from sm), a 56px search pill capped at 576px, and two category circles (112px on phones, 144px from sm, 24px/48px apart); shelves follow, stacked 56px apart. Shelves are single rows that scroll sideways with snap, bleeding to the screen edge through negative gutters; cards are 160px wide on phones and 208px from sm, 16px/24px apart.

The product page runs a two-column hero inside its tinted band (tile column 18rem from sm, 22rem from lg; 48px gap), then sections stacked 64px apart. Taste sliders use a three-column grid (pole word, track, pole word) beside a 16rem caption from md. Flavour cards scroll sideways on phones (224px each) and become a three-column grid from sm. Explore has a left filter rail that wraps into inline rows on smaller screens.

Below 640px the header drops its nav links and Log button, and a fixed bottom tab bar (Home, Explore, Log, Journal) takes over, padded for the safe area.

## Elevation & Depth

Flat by default. Depth is tonal: a warm grey tile on white, a 8% category tint behind the product hero, a 70% white tile inside that band. The only shadows are inherited from the UI primitives (a hairline shadow on outline buttons and fields, a large soft shadow under dialogs over a 50% black scrim) plus a small shadow when the large search pill has focus. The nav and tab bar use 95% white with a small backdrop blur rather than a shadow.

### Shadow Vocabulary

- **Hairline lift** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): outline buttons and form fields at rest.
- **Search focus** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): the 56px home search pill on focus.
- **Dialog** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): modal dialogs only.

### Named Rules

**The Tile Not Shadow Rule.** A product is lifted off the page by its grey tile, never by a drop shadow. Hover on a tile darkens it slightly (brightness 0.97); category circles lift 4px.

## Shapes

Soft and rounded throughout. Product tiles, flavour cards, review cards, photos and the prep panel are 16px; empty-state panels, the journal stats strip and all dialogs are 24px; filter rows are 12px. Every button (enforced globally), chip, search field, star hit area, avatar, category circle, slider track and marker is a full pill or circle. Borders are 1px hairlines; cards with a coloured header (flavour cards) clip it to their radius.

The drawn tin is the signature silhouette: a rounded body with a darker right-side shade, a wider lid, a narrow white highlight, a cream label between two thin ink rules, and either the brand initial (800 weight) or a leaf mark. A soft 8% ground shadow ellipse sits under it.

## Components

### Buttons

Pill-shaped and compact, like an app's.

- **Shape:** full pill (9999px), applied to every button globally.
- **Primary:** deep matcha green, white 14px 500-weight text, 36px tall, 16px side padding (12px with an icon).
- **Hover / Focus:** 90% green on hover; a 2px focus outline in the focus-ring grey, offset 2px.
- **Outline:** white with a hairline border and hairline shadow; hover fills neutral-100. Used for "Want to try" (white on the hero band) and "Continue with Google" (48px, full width).
- **Compact icon:** a 32px white circle in a card's top-right corner for save-to-try; the bookmark fills when saved.

### Chips

- **Category:** solid jade or amber, white 12px 600, 2px by 10px, pill. Shown on the product hero and over photographed products; drawn tins already show category by colour.
- **Meta:** white pills on the hero band for grade and region.
- **Note:** shelf-tile pills at 12px listing flavour notes in a review.
- **Score:** a 15% category-tint pill with a filled star and a bold tabular score, heading each review.

### Cards / Containers

- **Shelf card:** no container; a square 16px tile, then brand (muted 14px), name (title, 2-line clamp) and a one-star rating line. Hover darkens the tile and underlines the name.
- **Review card:** white, hairline border, 16px radius, 20px padding; score pill, text with "Read more", note chips, then a hairline-topped footer with a 24px initial avatar, name and date.
- **Flavour card:** hairline border, 16px radius, an 80px header band in the family colour with a 44px 20%-white disc holding a white icon, then the notes (600) and a muted mention count.
- **Muted panel:** shelf-tile fill, 24px radius, used for empty states and the journal stats strip.

### Inputs / Fields

- **Search pill:** white, hairline border, pill; 56px with 16px text and a 20px icon on home, 40px with 14px text in the header. Border darkens to neutral-300 on hover and neutral-400 on focus. It is a plain GET form.
- **Sort select:** a 160px pill trigger.
- **Dialog fields:** primitive fields with the field-edge stroke and the global focus outline.

### Navigation

- **Header:** sticky, 64px, 95% white with blur and a hairline bottom edge. Wordmark (logo plus 20px 800 green "Matchoji"), header search (hidden on home), then Explore and Journal as 14px 600 links, muted until active; "Log a tasting" and auth at the right.
- **Mobile tab bar:** fixed, 95% white with blur and a hairline top edge; 20px icons over 11px 600 labels, green when active; the Log tab is a 24px green disc with a white plus.
- **Filter rail:** radio-dot links (18px circle, active a 5px green ring), with 10px category swatches beside Matcha and Hojicha.
- **Footer:** shelf-tile fill, green wordmark, 14px 600 links.

### Taste Sliders

Each attribute runs between two plain pole words. A 8px shelf-tile track holds a pill marker 22% of the track wide, in the category fill, placed at the crowd average. On first show the marker slides from the low end (600ms, cubic-bezier(0.16, 1, 0.3, 1)) and stays visible throughout.

### Rating Distribution

Five rows (5 to 1 stars) with an 8px track and a category-filled bar that grows from zero (200ms, same easing). Both motions are off under reduced motion.

### Rate It Row

Five 32px outline stars in neutral-300 that fill in the category colour up to the hovered or focused star and scale 110% on hover. One tap opens the rating dialog (24px radius) with that star set; signed out, the tap opens the sign-in dialog instead.

### Drawn Tin

Stands in for any product photo on tiles, in category circles and in the journal. See Shapes for its anatomy and Colors for its tones.

## Do's and Don'ts

### Do:

- **Do** put every product on a 16px shelf-tile tile, and draw its tin when there is no photo.
- **Do** use deep matcha green only for actions and the wordmark.
- **Do** pull jade and amber from the category style map for every chip, star, marker, bar, tint and band.
- **Do** lead any rating with the 800-weight tabular numeral, with fractional stars beside it.
- **Do** make every button, chip and search field a full pill.
- **Do** separate surfaces with tile tone and 1px hairlines rather than shadows.
- **Do** keep authored motion to the bar-grow and marker-slide data animations and small hover lifts, and switch them off under reduced motion.

### Don't:

- **Don't** use jade, amber or the flavour colours for buttons or links.
- **Don't** use flavour-family colours anywhere outside the flavour cards.
- **Don't** add drop shadows to product tiles or cards.
- **Don't** introduce a second display face, uppercase tracked labels or kickers above headings.
- **Don't** show invented scores: an unrated tea shows an en dash numeral and "Not yet rated".
- **Don't** square off buttons or chips with small radii.
