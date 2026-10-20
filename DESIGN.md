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
  input-stroke: 'oklch(0.922 0 0)'
  focus-ring: 'oklch(0.708 0 0)'
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
---

# Design System: Matchoji

## Overview

**Creative North Star: "The Tasting Ledger"**

Matchoji is a working logbook, not a showcase. The page is a faint paper tone, the working surfaces laid on it (cards, navbar, tab rail, search, filters, frames) are white, text is near-black, chrome is greyscale, and one workhorse sans (Lato) carries every word. Against that quiet ledger, exactly two colours do real work: jade marks matcha, amber marks hojicha. Category colour is data. It appears wherever a product or rating appears, so the scarce-matcha, abundant-hojicha contrast reads at a glance across a whole feed.

The system runs in Operate mode: dense enough to scan a grid of products, calm enough to read reviews. Components are shadcn primitives with the category layer applied on top; the bespoke language is small: the category badge, the product card's image well, the score numeral and the star rating. Depth comes from the two-tone surface, white on paper, not from shadows. Cards rest flat on a hairline and darken that hairline on hover.

The confirmed rejection is the neutral-grayscale rating-app look where category is only a text label (the Vivino and Untappd clone pattern). Here, category is never a label alone.

**Key Characteristics:**

- Paper ground (#f6f4ef) with white surfaces, near-black ink (#101010), greyscale chrome.
- Two functional category colours, jade and amber, carried as fills, tints and graphics; both hold white text at WCAG AA.
- One typeface, Lato, for everything; a heavy tabular score numeral is its signature.
- Product cards lead with an image well: the photo, or a category-tinted field with a drawn leaf.
- Flat surfaces with hairline borders; no resting shadows on cards.
- Centred 1184px column with 24px gutters on every page.

## Colors

A greyscale ledger on paper, with two data colours that only ever mean "this is matcha" or "this is hojicha".

### Primary

- **Matcha Jade** (matcha-jade): The matcha category. Fills the matcha badge and the active Matcha tab, fills stars on matcha ratings (display and input), and draws the leaf mark in an empty matcha image well. Darkened from the logo hex until white text on it clears 4.5:1 (4.83:1).
- **Hojicha Amber** (hojicha-amber): The hojicha category, in exactly the same roles as jade. Darkened from the initial logo hex `#a9762c` for the same AA reason.
- **Category Tints** (matcha-tint, hojicha-tint): The category colour at 15%, used only as the field of an image well that has no photo.
- **Category White** (category-foreground): Text on any jade or amber fill. Never place ink on a category fill.

### Neutral

- **Paper Ground** (paper-ground): The page itself, behind everything, and the fill of outline buttons. A faint warm paper, never used for a card or panel.
- **White Surface** (white-surface): Every surface laid on the ground: product cards, navbar, category tab rail, search field, filter selects, empty and no-results frames, popovers and dialogs.
- **Ink** (ink): All primary text, including the score numeral.
- **Primary Charcoal** (primary-charcoal, hover primary-charcoal-hover, text charcoal-foreground): Default buttons ("Sign in with Google", "Log a tasting", form submit) and the active All tab. Neutral actions stay charcoal; they never take a category colour.
- **Soft Grey** (soft-grey, hover soft-grey-hover): Secondary and accent fills, outline-button hover, the active combobox and select row.
- **Muted Text** (muted-text): Brands, grade and region meta, review counts, reviewer names, inactive tabs and nav links, placeholders, empty states, unfilled stars. Darkened so it clears 4.5:1 on paper (about 5.0:1) as well as on white.
- **Hairline** (hairline, hover hairline-hover): Every border: navbar and footer rules, card edges, tab rail, review dividers, dashed empty-state frames. A product card's hairline darkens to hairline-hover on hover.
- **Input Stroke** (input-stroke) and **Focus Ring** (focus-ring): Field outlines and the focus halo, the latter used at 50% for the 3px ring.
- **Destructive** (destructive): Field errors and invalid outlines only.

Dark-mode values exist in `globals.css` (the scaffold's inverted greyscale, where ground and surfaces share one black), but the app ships `defaultTheme="light"`; jade and amber are fixed and do not change between themes.

### Named Rules

**The Paper and White Rule.** The ground is paper; anything a person reads or operates sits on a white surface laid on it. Depth is that two-tone step, not a shadow. Never fill a card or panel with the paper tone, and never put the page itself on white.

**The Category-Is-Data Rule.** Jade and amber appear only where a product's category is being expressed: badge, image-well tint and leaf mark, star fill, active category tab. They always come from `CATEGORY_STYLES`; no component hard-codes them. The one ambient use is the text-selection tint (jade at 25%), which is native to the world.

**The Jade-on-White Rule.** Jade text measures 4.39:1 on paper, below AA, and 4.83:1 on white. Jade (and, for parity, amber) appears as text only on a white surface; everywhere else it is a graphic: stars, bars, tints, badges, the leaf mark.

**The Charcoal Action Rule.** Buttons and other neutral actions are charcoal or outline. A jade "Submit" button would claim every rating is matcha.

## Typography

**Body Font:** Lato (via `next/font`, `--font-lato`), with the system sans stack as fallback.

**Character:** One sturdy humanist sans, used plainly. Hierarchy comes from size and weight (900 for the score numeral, 700 for page headings, 600 for titles and labels, 500 for tabs, links and buttons), never from a second family.

### Hierarchy

- **Headline** (700, 1.875rem, tight tracking): Page titles: "Discover" and the product name on detail. Discover steps up to 2.25rem from `sm`.
- **Score Numeral** (900, 1.25rem on cards, line-height 1, tight tracking, tabular figures): A product's average to one decimal, in ink; an en dash in muted text when unrated. The component also carries a 3rem size for product pages.
- **Wordmark** (700, 1.25rem, tight tracking): "Matchoji" in the navbar.
- **Title** (600, 1.125rem): Section headings ("Rate it", "Reviews").
- **Card Title** (600, 1rem, line-height 1.25): Product name in cards and combobox rows.
- **Body** (400, 1rem): Page subtitles, brand line on detail, empty-state copy.
- **Body Small** (400, 0.875rem): Review notes (capped at `max-w-prose`, about 65ch), meta, rating counts with tabular numerals, buttons, tabs and nav links (at 500).
- **Label** (600, 0.75rem): Category badges. Reviewer names and grade/region meta use the same size at 400 in muted text.

### Named Rules

**The One Voice Rule.** Lato only. No display face, no serif accent, no mono in shipped UI. This is Operate, not Persuade.

**The Numeral-First Rule.** Wherever a product's average is shown as a score, the heavy tabular numeral leads and the stars follow at a smaller size. The numeral is the first thing a taster reads; stars and count support it.

## Layout

Every page uses one centred column: max width 1184px (`max-w-site`), 24px horizontal gutter. Most pages take 48px vertical padding; Discover takes 40px, 56px from `sm`. The navbar and footer share the same column and gutter, so edges line up from top to bottom.

- **Discover feed:** heading and subtitle, then 32px below a toolbar: a full-width 44px search field, then a row with the category tabs left and the region and sort selects pushed right (wrapping on narrow screens), then the product grid 32px below. Grid: 2 columns from the smallest screen, 3 from `lg` (1024px), 4 from `xl` (1280px), with 12px gaps rising to 20px from `sm`.
- **Product detail:** a header block (name with inline badge, brand, grade/region, aggregate rating), then 40px below a two-column grid from `lg`: reviews in a fluid column and "Rate it" in a fixed 22rem column, 48px apart, with "Rate it" aligned to the top of its row rather than stretched. Below `lg` the columns stack with "Rate it" first, so a signed-in visitor can rate without scrolling past every review.
- **Rhythm:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px. Stacked form fields sit 16px apart; card internals use 8 to 12px steps.
- **Loading:** skeletons mirror the final layout (heading bars, toolbar, card skeletons in the same grid), so nothing shifts on load.

## Elevation & Depth

The system is flat with hairlines on a two-tone ground. White surfaces on paper carry the separation that shadows used to; no card or panel has a resting shadow. A product card signals that it is a link by darkening its hairline and underlining its name on hover. Dialogs and select popovers use the primitives' overlay shadows, and inputs and outline buttons carry the near-invisible field shadow. Everything else (navbar, tabs, review rows, empty state) is separated by 1px hairline borders only.

### Shadow Vocabulary

- **Overlay** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): the "Log a tasting" dialog.
- **Popover** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): select and menu popovers.
- **Field** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): inputs, select triggers and outline buttons.

### Named Rules

**The Hairline-First Rule.** Separate with the paper-to-white step and 1px hairline borders before reaching for shadow. Only floating layers (dialogs, popovers) cast one; a clickable card answers hover with a darker hairline, not a lift.

## Shapes

Gently rounded throughout, from a 10px base radius: cards, tab rails, dialogs and empty-state frames use 10px; buttons, inputs, tabs, combobox lists and review photos use 8px. Pills (fully round) are reserved for category badges and the avatar/account trigger. Dashed hairline frames mark "nothing here yet" (empty feed, "add as new product"); a solid hairline frame marks "nothing matches" (no search results).

Product cards clip their image well to the card's top corners, so the well reads as part of the card rather than an inset picture. Borders are uniform 1px hairlines on all four sides.

## Components

### Buttons

Plain and confident, straight from the shadcn primitive.

- **Shape:** gently rounded (8px), 36px tall, 14px medium text.
- **Primary:** charcoal fill, off-white text, 90% opacity on hover. Pending submits show a spinning loader icon before the label. Icons sit before the label ("+ Log a tasting").
- **Outline:** paper fill with hairline border and field shadow; soft-grey fill on hover ("Load more (n left)").
- **Focus:** 3px ring in the focus-ring colour at 50%. Disabled drops to 50% opacity.

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
- **Body:** 12px padding, 16px from `sm`. Name (underlines on card hover) and brand, then grade and region as a muted dot-separated line, then the score row pinned to the bottom: score numeral, five 14px category stars (hidden below `sm`), and the review count in muted tabular numerals. Unrated products read "Not yet rated".
- **Interaction:** the whole card is one link; focus shows a 2px ring with offset.

### Score Numeral

- **Style:** Lato 900, tabular figures, tight tracking, line-height 1, in ink; one decimal ("4.2"). Unrated shows an en dash in muted text.
- **Sizes:** 20px on cards; 48px for a product page's headline score.

### Star Rating

- **Display:** five outline stars. Filled stars take the category colour; unfilled stars are muted. On cards they are 14px and follow the score numeral. Elsewhere they are 16px, followed by the average to one decimal and the review count in small muted tabular numerals. Unrated products read "Not yet rated".
- **Input:** five 28px star buttons in a radiogroup, filling in the category colour on hover preview and selection.

### Inputs / Fields

- **Style:** input-stroke border, 8px radius, 36px tall, field shadow; transparent fill by default, white where the field sits directly on paper (search, filter selects).
- **Focus:** border shifts to focus-ring with a 3px ring at 50%.
- **Error:** destructive border and a faint destructive ring; inline messages sit under the field.
- **Combobox:** results list as hairline-divided rows in an 8px-radius frame; the active row takes the soft-grey fill.

### Navigation

- **Navbar:** sticky, full-width white surface with a bottom hairline, at least 64px tall. Left: bold wordmark, then Discover and Journal links 32px after it (14px medium, 24px apart; muted, ink on hover, ink when current with `aria-current="page"`; product pages mark Discover). Right: the global "Log a tasting" primary button, then the auth control ("Sign in with Google" when signed out, round avatar menu when signed in).
- **Narrow screens:** below `sm` the links hide and the same two links appear at the top of the account menu; "Log a tasting" stays visible as an icon-only button with an accessible label.
- **Footer:** top hairline, muted 14px "Matchoji", same column and gutter.

### Empty State

- **Style:** white surface in a dashed hairline frame at 10px radius, 80px vertical padding, centred muted copy capped near 24rem, with the "Log a tasting" action below. Copy names the category when a tab is active ("No matcha logged yet.").

### Review Item

- **Style:** rows divided by bottom hairlines (none on the last), 16px vertical padding. Category-filled stars left, muted reviewer name right, notes below in small text capped near 65ch, with an underlined "Read more" / "Show less" toggle for long notes. Optional photo is a 160px square crop at 8px radius.

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
- **Do** stack the detail page's "Rate it" column above reviews below `lg`.

### Don't:

- **Don't** use jade or amber decoratively, for status, or for anything other than a product's category (the 25% jade selection tint is the only ambient exception).
- **Don't** set jade or amber text on the paper ground; jade measures 4.39:1 there. Use them as text only on white, otherwise as stars, bars, tints and badges.
- **Don't** add a display face, second family or mono to shipped UI; Lato carries everything.
- **Don't** reduce category to a text label alone; any product or rating shown must carry its colour.
- **Don't** bring back the category side stripe on cards, or add coloured side stripes to any container; category lives in the image well, badge and stars.
- **Don't** add resting shadows to cards or panels; the paper-to-white step and hairlines carry depth.
- **Don't** add uppercase tracked eyebrow labels above titles; section titles carry hierarchy alone.
