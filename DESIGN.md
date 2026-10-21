---
name: Matchoji
description: Rate and discover hojicha and matcha, one cup at a time.
colors:
  matcha-jade: '#5c7a4f'
  hojicha-amber: '#8f6224'
  category-foreground: '#ffffff'
  matcha-tint: 'color-mix(in oklab, #5c7a4f 15%, transparent)'
  hojicha-tint: 'color-mix(in oklab, #8f6224 15%, transparent)'
  ink: '#101010'
  paper-ground: '#f6f4ef'
  white-surface: '#ffffff'
  primary-charcoal: '#171717'
  primary-charcoal-hover: '#262626'
  charcoal-foreground: '#f9f9f9'
  soft-grey: '#f5f5f5'
  soft-grey-hover: '#e5e5e5'
  muted-text: 'oklch(0.52 0 0)'
  hairline: '#d4d4d4'
  hairline-hover: '#a3a3a3'
  input-stroke: 'oklch(0.8 0 0)'
  focus-ring: 'oklch(0.35 0 0)'
  destructive: 'oklch(0.577 0.245 27.325)'
typography:
  headline:
    fontFamily: 'Lato, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.875rem'
    fontWeight: 700
    lineHeight: '2.25rem'
    letterSpacing: '-0.025em'
  wordmark:
    fontFamily: 'Lato, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    lineHeight: '1.75rem'
    letterSpacing: '-0.025em'
  score-numeral:
    fontFamily: 'Lato, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 900
    lineHeight: 1
    letterSpacing: '-0.025em'
    fontFeature: '"tnum"'
  title:
    fontFamily: 'Lato, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: '1.75rem'
  card-title:
    fontFamily: 'Lato, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: 'Lato, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: '1.5rem'
  body-sm:
    fontFamily: 'Lato, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: '1.25rem'
  label:
    fontFamily: 'Lato, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 600
    lineHeight: '1rem'
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  card-sm: '12px'
  md: '16px'
  card-gap: '20px'
  gutter: '24px'
  lg: '32px'
  xl: '48px'
components:
  button-primary:
    backgroundColor: '{colors.primary-charcoal}'
    textColor: '{colors.charcoal-foreground}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
    height: '36px'
  button-outline:
    backgroundColor: '{colors.paper-ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
    height: '36px'
  button-outline-hover:
    backgroundColor: '{colors.soft-grey}'
  input:
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '4px 12px'
    height: '36px'
  input-search:
    backgroundColor: '{colors.white-surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '4px 12px 4px 36px'
    height: '44px'
  badge-matcha:
    backgroundColor: '{colors.matcha-jade}'
    textColor: '{colors.category-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    padding: '2px 10px'
  badge-hojicha:
    backgroundColor: '{colors.hojicha-amber}'
    textColor: '{colors.category-foreground}'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    padding: '2px 10px'
  category-tabs:
    backgroundColor: '{colors.white-surface}'
    rounded: '{rounded.lg}'
    padding: '4px'
  category-tab:
    textColor: '{colors.muted-text}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: '6px 12px'
  category-tab-active-all:
    backgroundColor: '{colors.primary-charcoal}'
    textColor: '{colors.charcoal-foreground}'
  category-tab-active-matcha:
    backgroundColor: '{colors.matcha-jade}'
    textColor: '{colors.category-foreground}'
  category-tab-active-hojicha:
    backgroundColor: '{colors.hojicha-amber}'
    textColor: '{colors.category-foreground}'
  product-card:
    backgroundColor: '{colors.white-surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '16px'
  image-well-matcha:
    backgroundColor: '{colors.matcha-tint}'
    textColor: '{colors.matcha-jade}'
  image-well-hojicha:
    backgroundColor: '{colors.hojicha-tint}'
    textColor: '{colors.hojicha-amber}'
  navbar:
    backgroundColor: '{colors.white-surface}'
    textColor: '{colors.ink}'
    height: '64px'
  bar-track:
    backgroundColor: '{colors.soft-grey}'
    rounded: '{rounded.full}'
    height: '8px'
  bar-track-compact:
    backgroundColor: '{colors.soft-grey}'
    rounded: '{rounded.full}'
    height: '6px'
  bar-fill-matcha:
    backgroundColor: '{colors.matcha-jade}'
    rounded: '{rounded.full}'
  bar-fill-hojicha:
    backgroundColor: '{colors.hojicha-amber}'
    rounded: '{rounded.full}'
  note-chip-matcha:
    backgroundColor: '{colors.matcha-tint}'
    textColor: '{colors.ink}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.full}'
    padding: '4px 12px'
  note-chip-hojicha:
    backgroundColor: '{colors.hojicha-tint}'
    textColor: '{colors.ink}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.full}'
    padding: '4px 12px'
  note-chip-compact:
    rounded: '{rounded.full}'
    padding: '2px 10px'
  pill-toggle:
    textColor: '{colors.ink}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.full}'
    padding: '4px 12px'
  pill-toggle-pressed-matcha:
    backgroundColor: '{colors.matcha-jade}'
    textColor: '{colors.category-foreground}'
  pill-toggle-pressed-hojicha:
    backgroundColor: '{colors.hojicha-amber}'
    textColor: '{colors.category-foreground}'
  method-pill-checked:
    backgroundColor: '{colors.primary-charcoal}'
    textColor: '{colors.charcoal-foreground}'
    rounded: '{rounded.full}'
    padding: '4px 12px'
  insights-panel:
    backgroundColor: '{colors.white-surface}'
    rounded: '{rounded.lg}'
    padding: '24px'
  rate-panel:
    backgroundColor: '{colors.white-surface}'
    rounded: '{rounded.lg}'
    padding: '20px'
    width: '22rem'
  hero-image-well:
    rounded: '{rounded.lg}'
    width: '14rem'
  note-chip-card:
    textColor: '{colors.ink}'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    padding: '2px 8px'
  want-to-try:
    backgroundColor: '{colors.white-surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
    height: '36px'
  want-to-try-compact:
    backgroundColor: '{colors.white-surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.full}'
    size: '32px'
  journal-stats-panel:
    backgroundColor: '{colors.white-surface}'
    rounded: '{rounded.lg}'
    padding: '24px'
  journal-entry-row:
    backgroundColor: '{colors.white-surface}'
    padding: '16px'
  wishlist-row:
    backgroundColor: '{colors.white-surface}'
    padding: '12px 16px'
  photo-trigger:
    backgroundColor: '{colors.white-surface}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: '8px 12px'
---

# Design System: Matchoji

## Overview

**Creative North Star: "The Tasting Ledger"**

Matchoji is a working logbook, not a showcase. The page is a faint paper tone, the working surfaces laid on it (cards, navbar, tab rail, search, filters, frames) are white, text is near-black, chrome is greyscale, and one workhorse sans (Lato) carries every word. Against that quiet ledger, exactly two colours do real work: jade marks matcha, amber marks hojicha. Category colour is data. It appears wherever a product or rating appears, so the scarce-matcha, abundant-hojicha contrast reads at a glance across a whole feed.

The system runs in Operate mode: dense enough to scan a grid of products, calm enough to read reviews. Components are shadcn primitives with the category layer applied on top; the bespoke language is small: the category badge, the product card's image well, the score numeral, the star rating and the taste-profile bars. The journal reuses that same vocabulary on white ruled lists rather than adding new pieces. Depth comes from the two-tone surface, white on paper, not from shadows. Cards rest flat on a hairline and darken that hairline on hover.

The confirmed rejection is the neutral-grayscale rating-app look where category is only a text label (the Vivino and Untappd clone pattern). Here, category is never a label alone.

**Key Characteristics:**

- Paper ground (#f6f4ef) with white surfaces, near-black ink (#101010), greyscale chrome.
- Two functional category colours, jade and amber, carried as fills, tints and graphics; both hold white text at WCAG AA.
- One typeface, Lato, for everything; a heavy tabular score numeral is its signature.
- Product cards lead with an image well: the photo, or a category-tinted field with a drawn leaf.
- Flat surfaces with hairline borders; no resting shadows on cards.
- Centred 1184px column with 24px gutters on every page.
- Taste-profile bars (1 to 5, filled in the category colour) are the signature data graphic; they and the rating histogram carry the system's one authored motion.

## Colors

A greyscale ledger on paper, with two data colours that only ever mean "this is matcha" or "this is hojicha".

### Primary

- **Matcha Jade** (matcha-jade): The matcha category. Fills the matcha badge and the active Matcha tab, fills stars on matcha ratings (display and input), fills taste-profile and rating-distribution bars and pressed flavour-note toggles, and draws the leaf mark in an empty matcha image well. Darkened from the logo hex until white text on it clears 4.5:1 (4.83:1).
- **Hojicha Amber** (hojicha-amber): The hojicha category, in exactly the same roles as jade. Darkened from the initial logo hex `#a9762c` for the same AA reason.
- **Category Tints** (matcha-tint, hojicha-tint): The category colour at 15%, used as the field of an image well that has no photo and as the fill of read-only flavour-note chips (ink text on the tint) in reviews, insights, journal entries and product cards.
- **Category White** (category-foreground): Text on any jade or amber fill. Never place ink on a category fill.

### Neutral

- **Paper Ground** (paper-ground): The page itself, behind everything, and the fill of outline buttons. A faint warm paper, never used for a card or panel.
- **White Surface** (white-surface): Every surface laid on the ground: product cards, navbar, category tab rail, search field, filter selects, empty and no-results frames, popovers and dialogs.
- **Ink** (ink): All primary text, including the score numeral.
- **Primary Charcoal** (primary-charcoal, hover primary-charcoal-hover, text charcoal-foreground): Default buttons ("Log a tasting", form submit, the signed-out journal's "Sign in with Google"), the active All tab and the chosen prep method. Neutral actions stay charcoal; they never take a category colour.
- **Soft Grey** (soft-grey, hover soft-grey-hover): Secondary and accent fills, outline- and ghost-button hover, the active combobox and select row, and the empty track of every data bar.
- **Muted Text** (muted-text): Brands, grade and region meta, review counts, reviewer names, inactive tabs and nav links, placeholders, empty states, unfilled stars. Darkened so it clears 4.5:1 on paper (about 5.0:1) as well as on white.
- **Hairline** (hairline, hover hairline-hover): Every border: navbar and footer rules, card edges, tab rail, review and journal-row dividers, the rate form's section rule, dashed empty-state frames. A product card's hairline darkens to hairline-hover on hover. Hairline-hover is also the native scrollbar thumb (on a transparent track).
- **Input Stroke** (input-stroke) and **Focus Ring** (focus-ring): Field outlines (and the photo trigger's border), and the focus indicator. Focus Ring draws the global 2px solid focus outline at full strength (it clears 3:1 on white and on paper); the primitives' 3px halo still sits under it at 50%.
- **Destructive** (destructive): Field errors and invalid outlines only.

Dark-mode values exist in `globals.css` (the scaffold's inverted greyscale, where ground and surfaces share one black), but the app ships `defaultTheme="light"`; jade and amber are fixed and do not change between themes.

### Named Rules

**The Paper and White Rule.** The ground is paper; anything a person reads or operates sits on a white surface laid on it. Depth is that two-tone step, not a shadow. Never fill a card or panel with the paper tone, and never put the page itself on white.

**The Category-Is-Data Rule.** Jade and amber appear only where a product's category is being expressed: badge, image-well tint and leaf mark, star fill, active category tab, data-bar fill (including the journal's category-split bar), flavour-note chips and pressed toggles. They always come from `CATEGORY_STYLES`; no component hard-codes them. The two ambient uses are both browser surfaces native to the world: the text-selection tint (jade at 25%) and jade as the page's `accent-color` for native controls.

**The Jade-on-White Rule.** Jade text measures 4.39:1 on paper, below AA, and 4.83:1 on white. Jade (and, for parity, amber) appears as text only on a white surface; everywhere else it is a graphic: stars, bars, tints, badges, the leaf mark.

**The Charcoal Action Rule.** Buttons and other neutral actions are charcoal or outline. A jade "Submit" button would claim every rating is matcha.

## Typography

**Body Font:** Lato (via `next/font`, `--font-lato`), with the system sans stack as fallback.

**Character:** One sturdy humanist sans, used plainly. Hierarchy comes from size and weight (900 for the score numeral, 700 for page headings, 600 for titles and labels, 500 for tabs, links and buttons), never from a second family.

### Hierarchy

- **Headline** (700, 1.875rem, tight tracking): Page titles: "Discover", "Your journal" and the product name on detail. All step up to 2.25rem from `sm`.
- **Score Numeral** (900, 1.25rem on cards, line-height 1, tight tracking, tabular figures): A product's average to one decimal, in ink; an en dash in muted text when unrated. It is set at 1.875rem in the journal's stats panel (the tastings count uses the same 900 tabular style there) and 3rem on product pages.
- **Wordmark** (700, 1.25rem, tight tracking): "Matchoji" in the navbar.
- **Title** (600, 1.125rem): Section headings ("Rate it", "Reviews", "Want to try", the journal's month headings).
- **Card Title** (600, 1rem, line-height 1.25): Product name in cards, combobox rows and journal entries (500 in the want-to-try list); section headings inside the insights panel ("Ratings", "Taste profile", "Most noticed").
- **Body** (400, 1rem): Page subtitles, brand line on detail, empty-state copy.
- **Body Small** (400, 0.875rem): Review notes (capped at `max-w-prose`, about 65ch), meta, rating counts with tabular numerals, buttons, tabs and nav links (at 500), full taste-profile and distribution rows, flavour-note chips and toggles, the prep line, journal stat labels (muted) and day labels (muted, tabular), form labels and the rate form's group headings (at 500).
- **Label** (600, 0.75rem): Category badges. Reviewer names, grade/region meta, panel asides ("From 4 tastings"), the "n of 6" counter, compact profile labels, in-review, journal and product-card note chips, and the journal's prep line use the same size at 400, in muted text except the chips.

### Named Rules

**The One Voice Rule.** Lato only. No display face, no serif accent, no mono in shipped UI. This is Operate, not Persuade.

**The Numeral-First Rule.** Wherever a product's average is shown as a score, the heavy tabular numeral leads and the stars follow at a smaller size. The numeral is the first thing a taster reads; stars and count support it.

## Layout

Every page uses one centred column: max width 1184px (`max-w-site`), 24px horizontal gutter. Most pages take 48px vertical padding; Discover takes 40px, 56px from `sm`. The navbar and footer share the same column and gutter, so edges line up from top to bottom.

- **Discover feed:** heading and subtitle, then 32px below a toolbar: a full-width 44px search field, then a row with the category tabs left and the region and sort selects pushed right (wrapping on narrow screens), then the product grid 32px below. Grid: 2 columns from the smallest screen, 3 from `lg` (1024px), 4 from `xl` (1280px), with 12px gaps rising to 20px from `sm`. Cards in a row are equal height, with the score row pinned to the bottom.
- **Product detail:** 40px top padding, 56px from `sm`. A hero: from `sm` a 14rem square image well (hairline, 10px radius) beside a vertically centred stack of badge, name (1.875rem, 2.25rem from `sm`), muted brand (1.125rem), grade/region, then the 48px score numeral with stars and review count, then the "Want to try" button 20px below; below `sm` the well stacks above, capped at 14rem. Then the insights panel 40px below, then 40px below that a two-column grid from `lg`: reviews in a fluid column and "Rate it" in a fixed 22rem column, 48px apart, with "Rate it" aligned to the top of its row rather than stretched. Reviews come before "Rate it" in DOM order, so below `lg` the columns stack with reviews first; the navbar's "Log a tasting" and the `#rate` anchor reach the form directly.
- **Insights panel:** one column, two from `sm`, 32px gaps; the photo strip spans both columns.
- **Journal:** the Discover padding (40px, 56px from `sm`). Heading and subtitle, then 32px below the stats panel (one column, four from `sm`, 24px gaps), then 40px below that the same two-column grid as product detail from `lg`: the month-grouped timeline in the fluid column (months 40px apart) and "Want to try" in the 22rem column, top-aligned, 48px apart. With no tastings the stats panel gives way to the dashed empty frame, and "Want to try" runs full width below it. Signed out, the page shows only the heading, one sentence and the primary sign-in button 24px below.
- **Rhythm:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px. Stacked form fields sit 16px apart; card internals use 8 to 12px steps.
- **Loading:** skeletons mirror the final layout (heading bars, toolbar, card skeletons in the same grid), so nothing shifts on load.

## Elevation & Depth

The system is flat with hairlines on a two-tone ground. White surfaces on paper carry the separation that shadows used to; no card or panel has a resting shadow. A product card signals that it is a link by darkening its hairline and underlining its name on hover. Dialogs and select popovers use the primitives' overlay shadows, and inputs and outline buttons carry the near-invisible field shadow. Everything else (navbar, tabs, review rows, insights and "Rate it" panels, journal stats panel, timeline and want-to-try lists, empty state) is separated by 1px hairline borders only.

### Shadow Vocabulary

- **Overlay** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): the "Log a tasting" dialog.
- **Popover** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): select and menu popovers.
- **Field** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): inputs, select triggers and outline buttons.

### Named Rules

**The Hairline-First Rule.** Separate with the paper-to-white step and 1px hairline borders before reaching for shadow. Only floating layers (dialogs, popovers) cast one; a clickable card answers hover with a darker hairline, not a lift.

## Shapes

Gently rounded throughout, from a 10px base radius: cards, tab rails, dialogs and empty-state frames use 10px; buttons, inputs, the photo trigger, tabs, combobox lists and review photos use 8px. Pills (fully round) are reserved for category badges, the avatar/account trigger, the compact want-to-try button, flavour-note chips and toggles, prep-method radios, and data bars (track and fill). Review photos in the insights strip are 112px squares at 8px. Dashed hairline frames mark "nothing here yet" (empty feed, "add as new product"); a solid hairline frame marks "nothing matches" (no search results).

Product cards clip their image well to the card's top corners, so the well reads as part of the card rather than an inset picture. Borders are uniform 1px hairlines on all four sides.

## Components

### Buttons

Plain and confident, straight from the shadcn primitive.

- **Shape:** gently rounded (8px), 36px tall, 14px medium text.
- **Primary:** charcoal fill, off-white text, 90% opacity on hover. Pending submits show a spinning loader icon before the label. Icons sit before the label ("+ Log a tasting").
- **Outline:** paper fill with hairline border and field shadow; soft-grey fill on hover ("Load more (n left)", the navbar's "Sign in with Google"). On a white surface or over a photo it takes a white fill ("Want to try").
- **Ghost:** no fill or border, soft-grey on hover; 36px icon-only (the want-to-try list's remove buttons).
- **Focus:** the global 2px focus-ring outline with a 2px offset, over the primitive's 3px ring at 50%. Disabled drops to 50% opacity.

### Category Badge

- **Style:** full pill, category fill, white 12px semibold label ("Matcha" or "Hojicha"), 2px by 10px padding.
- **Placement:** overlaid on the top-left of a product card's image well, inset 10px; inline after the product name on detail; at the end of combobox rows.

### Category Tabs

- **Style:** a segmented rail on a white surface (hairline border, 10px radius, 4px inner padding) of link tabs: 14px medium text, 8px radius.
- **State:** inactive tabs are muted text that darkens to ink on hover. The active tab fills with its own category colour (jade for Matcha, amber for Hojicha) and charcoal for All. Active state is exposed with `aria-current="page"`.

### Discover Toolbar

- **Search:** a 44px white field with a muted search icon inset left, placeholder "Search by name or brand". Submits as a plain GET form so it works before hydration.
- **Filters:** region and sort selects on white triggers (176px and 160px wide), sitting right of the category tabs. Every filter lives in the URL.
- **No results:** a white hairline frame with muted copy ("No teas match ...") and an underlined "Clear filters" link, distinct from the dashed empty-catalogue frame.

### Product Card

The signature component.

- **Corner Style:** 10px radius, content clipped.
- **Background:** white surface on the paper ground.
- **Border:** 1px hairline on all sides, darkening on hover. No category side stripe.
- **Image Well:** on top, square on mobile and 4:3 from `sm`. It shows the product photo cropped to fill, or, without one, a field in the category tint with a single 48px drawn leaf mark (1.5px stroke) in the category colour, centred. The category badge overlays its top-left corner.
- **Body:** 12px padding, 16px from `sm`. Name (underlines on card hover) and brand, then grade and region as a muted dot-separated line, then up to two of the product's most-noticed flavour notes as tinted 12px chips (2px by 8px, 4px gaps), then the score row pinned to the bottom: score numeral, five 14px category stars (hidden below `sm`), and the review count in muted tabular numerals. Unrated products read "Not yet rated".
- **Interaction:** the whole card is one link; focus shows a 2px ring with offset. An optional action (the compact "Want to try" button) sits in the top-right corner, 8px in, outside the link so it is its own control.

### Score Numeral

- **Style:** Lato 900, tabular figures, tight tracking, line-height 1, in ink; one decimal ("4.2"). Unrated shows an en dash in muted text.
- **Sizes:** 20px on cards; 30px in the journal's stats panel; 48px for a product page's headline score.

### Star Rating

- **Display:** five outline stars. Filled stars take the category colour; unfilled stars are muted. On cards they are 14px and follow the score numeral. Elsewhere they are 16px, followed by the average to one decimal and the review count in small muted tabular numerals. Unrated products read "Not yet rated".
- **Input:** five 28px star buttons in a radiogroup, filling in the category colour on hover preview and selection. The group is one tab stop; arrow keys move and select, wrapping at the ends.

### Inputs / Fields

- **Style:** input-stroke border, 8px radius, 36px tall, field shadow; transparent fill by default, white where the field sits directly on paper (search, filter selects). Number fields hide the native spinners; the date field's calendar icon sits at 55% opacity, 90% on hover.
- **Focus:** border shifts to focus-ring with a 3px ring at 50%, under the global 2px outline.
- **Error:** destructive border and a faint destructive ring; inline messages sit under the field.
- **Combobox:** results list as hairline-divided rows in an 8px-radius frame; the active row takes the soft-grey fill.

### Navigation

- **Navbar:** sticky, full-width white surface with a bottom hairline, at least 64px tall. Left: bold wordmark, then Discover and Journal links 32px after it (14px medium, 24px apart; muted, ink on hover, ink when current with `aria-current="page"`; product pages mark Discover). Right: the global "Log a tasting" primary button, then the auth control ("Sign in with Google" as an outline button when signed out, round avatar menu when signed in). "Log a tasting" is the navbar's one primary action.
- **Narrow screens:** below `sm` the links stay visible, wrapping to a second row under the wordmark and actions (8px row gap); the account menu holds only the account and sign-out, never the links. "Log a tasting" stays visible as an icon-only button with an accessible label.
- **Footer:** top hairline, muted 14px "Matchoji", same column and gutter.

### Empty State

- **Style:** white surface in a dashed hairline frame at 10px radius, 80px vertical padding, centred muted copy capped near 24rem, with the "Log a tasting" action below. Copy names the category when a tab is active ("No matcha logged yet."). The journal's empty view uses the same frame at 64px vertical padding.

### Review Item

- **Style:** rows divided by bottom hairlines (none on the last), 16px vertical padding. Category-filled 16px stars left, muted reviewer name right, then the review text in small text capped near 65ch, with an underlined "Read more" / "Show less" toggle for long notes. The text always comes first; the structured tasting follows it.
- **Structured tasting:** flavour-note chips (12px text, 2px by 10px, category tint, 6px gaps), then the compact taste profile capped near 28rem, then the prep line in 12px muted text. Optional photo is a 160px square crop at 8px radius. Each part renders only when the review carries it.

### Taste Profile Bars

The signature data graphic. One component reads both a single tasting and a product's average, so the two compare at a glance.

- **Scale:** sweetness, umami, bitterness and body, each a `role="meter"` on 1 to 5. Fill width is value / 5; only attributes with a value are shown.
- **Bar:** a soft-grey pill track with a pill fill in the category colour (`CATEGORY_STYLES.fill`).
- **Full:** stacked rows 10px apart: 6rem label, 8px bar, the value right-aligned in muted tabular numerals (integers plain, averages to one decimal). Used for the product average.
- **Compact:** a 2x2 grid (24px column gap, 4px row gap) of 12px muted labels in a 4.5rem column beside a 6px bar, no value. Used inside a review.
- **Motion:** fills grow from zero on first render (see Motion below).

### Rating Distribution

- **Style:** five rows, 5 stars first: the level with a 12px muted star, an 8px bar, the count right-aligned in muted tabular numerals. Same track and category fill as the taste bars.
- **Scale:** width is relative to the largest count, so the most common rating always fills the row.

### Product Insights

The crowd's view of a tea, between the hero and the reviews.

- **Panel:** white surface, 1px hairline, 10px radius, 24px padding. Nothing renders until the product has a rating.
- **Sections:** Ratings (the distribution), Taste profile (full bars, with a muted "From N tastings" aside right of the heading), Most noticed (note chips at 14px, 4px by 12px, category tint, each followed by its count in muted tabular numerals), How people make it (the prep line at 16px in ink), Photos (a horizontal strip of 112px squares, scrollbar hidden). Each section renders only when tastings carry its data; a new product shows nothing rather than empty charts.

### Prep Summary

- **Style:** one muted tabular line of the method then whichever of dose, water and temperature were logged, joined by middle dots: "Usucha · 2g · 70ml · 80°C". Absent without a method.

### Flavour Note Picker

- **Toggles:** pill buttons with `aria-pressed`, 14px text, 4px by 12px, 8px gaps. Unpressed: hairline border that darkens to hairline-hover on hover. Pressed: the solid category badge colours (fill with white text, border transparent).
- **Cap:** six notes. At the cap, unpressed toggles disable at 40% opacity; a muted 12px "n of 6" counter below announces politely.

### Taste Profile Input

- **Style:** per attribute, a 6rem label, a radiogroup of five segment buttons (28px hit area, 8px pill segment, 4px gaps), and the chosen value or an en dash in muted tabular numerals.
- **State:** segments up to the chosen step fill in the category colour (charcoal when no category is known); the rest are soft grey, hairline grey on hover. Clicking the chosen step clears it: every attribute is optional. Each attribute is one tab stop with arrow keys. Logging and reading a profile look the same.

### Prep Fields

- **Style:** a collapsed `<details>` in a hairline frame at 10px radius, summary "How you made it" (14px medium, 12px by 16px) with a drawn 16px muted chevron at the right that flips when open; the native marker is removed. Open, a hairline-topped body with 16px padding and 16px between rows. A field error forces it open.
- **Contents:** method pill radios (same pill as the note toggles; chosen is charcoal with off-white text, never a category colour; clicking the chosen method clears it; one tab stop with arrow keys), then a three-column row of number fields (dose, water, temperature). Collapsed by default so a quick rating stays quick.

### Rate Form

- **Order:** star rating, tasting notes (placeholder per category: "Creamy, grassy, sweet finish…" or "Toasty, nutty, smooth…"), a 176px "Tasted on" date field, then "What did you taste? (optional)": a group under a top hairline (16px padding below the rule), holding the flavour-note picker and the taste-profile input. Then the collapsed prep fields, then the photo, then the full-width submit. Fields sit 16px apart.
- **Photo:** the native file input is visually hidden. Its label is the trigger: a white field with an input-stroke border at 8px radius, 8px by 12px, a muted image icon and "Add a photo of your cup" in muted text, replaced by the chosen file name. The trigger shows the 2px ring when the hidden input has keyboard focus.

### Want to Try Button

- **Full:** an outline button with a white fill, a 16px bookmark icon before the label. The label is always "Want to try"; `aria-pressed` carries the saved state and the bookmark fills when saved. Sits under the product hero.
- **Compact:** a 32px round icon-only outline button with the same accessible name, in the top-right corner of a feed card.

### Journal

- **Stats panel:** a white `<dl>` panel, 1px hairline, 10px radius, 24px padding. Four stats, each a muted 14px label over its value, 8px apart: Tastings (30px 900 tabular count), Average rating (the score numeral at 30px), Category split (a static 8px pill bar, jade then amber in proportion, over a muted tabular "Matcha n · Hojicha n" line; the bar is hidden from assistive tech and has no motion), Your notes (the top notes as a comma list, or muted "None picked yet").
- **Timeline:** one section per month under a title heading, 12px above a white hairline-framed list at 10px radius, rows divided by hairlines. Each row is 16px padded, a 3.5rem gutter holding the muted tabular day ("Oct 3"), then 16px over: the product name as a link (underlines on hover) with its category badge, category stars at 14px, the note text capped near 65ch, tinted note chips (12px, 2px by 10px, 6px gaps), and the prep line in 12px. Each part renders only when the entry carries it.
- **Want to try list:** the same white hairline-divided list; each 12px by 16px row holds the product link (500, truncated) with its badge, and a ghost icon button (an X) to remove it. Empty, a muted sentence pointing at the "Want to try" button.

### Focus and Native Controls

- **Focus:** one visible treatment for every control: a 2px solid outline in the focus-ring colour with a 2px offset, declared outside every cascade layer so no utility can remove it.
- **Native surfaces:** the caret is ink, native controls take jade as their accent colour, scrollbars are a hairline-hover thumb on a transparent track. Summary disclosure markers are removed so each summary draws its own chevron.

### Motion

**The One Motion Rule.** Data bars (taste profile and rating distribution) grow from zero on first render: 200ms scaleX from the left edge, ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), switched off under `prefers-reduced-motion`. It is the one authored motion; everything else is 150ms colour and border feedback on hover and press, the prep summary's chevron flip, and the primitives' dialog transitions.

## Do's and Don'ts

### Do:

- **Do** pull every jade and amber use from `CATEGORY_STYLES`, so badge, tint, leaf, star and tab can never disagree.
- **Do** keep white text on both category fills; both were darkened specifically to clear 4.5:1.
- **Do** put cards, panels, fields and frames on white over the paper ground (#f6f4ef).
- **Do** lead a product's score with the heavy tabular numeral, stars after it.
- **Do** give every product card an image well: the photo, or the category tint with the leaf mark.
- **Do** keep neutral actions charcoal or outline, whatever the surrounding category.
- **Do** use the 1184px column with 24px gutters on every page.
- **Do** make loading skeletons match the final layout's grid and spacing.
- **Do** keep reviews before "Rate it" in the detail page's DOM order; below `lg` they stack reviews first.
- **Do** keep "Log a tasting" the navbar's one primary action; sign-in there is an outline button.
- **Do** keep the global 2px focus outline reachable on every control; never hide it with `outline-none`.
- **Do** make every radiogroup (stars, taste profile, prep method) one tab stop with arrow keys.
- **Do** use the same taste-profile bars for one tasting and for a product's average, full on the product, compact in a review.
- **Do** render each insights section only when tastings carry its data; never show an empty chart.
- **Do** keep a review's text before its note chips, profile and prep line.

### Don't:

- **Don't** use jade or amber decoratively, for status, or for anything other than a product's category (the 25% jade selection tint and jade `accent-color` on native controls are the only ambient exceptions).
- **Don't** set jade or amber text on the paper ground; jade measures 4.39:1 there. Use them as text only on white, otherwise as stars, bars, tints and badges.
- **Don't** add a display face, second family or mono to shipped UI; Lato carries everything.
- **Don't** reduce category to a text label alone; any product or rating shown must carry its colour.
- **Don't** bring back the category side stripe on cards, or add coloured side stripes to any container; category lives in the image well, badge and stars.
- **Don't** add resting shadows to cards or panels; the paper-to-white step and hairlines carry depth.
- **Don't** add uppercase tracked eyebrow labels above titles; section titles carry hierarchy alone.
- **Don't** animate anything beyond the data bars' first grow, the disclosure chevron and hover/press feedback, and never ship motion that ignores `prefers-reduced-motion`.
