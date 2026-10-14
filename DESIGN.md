---
name: Matchoji
description: Rate and discover hojicha and matcha, one cup at a time.
colors:
  matcha-jade: '#5c7a4f'
  hojicha-amber: '#8f6224'
  category-foreground: '#ffffff'
  ink: '#101010'
  off-white-ground: '#f9f9f9'
  primary-charcoal: '#171717'
  primary-charcoal-hover: '#262626'
  soft-grey: '#f5f5f5'
  soft-grey-hover: '#e5e5e5'
  muted-text: 'oklch(0.556 0 0)'
  hairline: '#d4d4d4'
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
  md: '16px'
  gutter: '24px'
  lg: '32px'
  xl: '48px'
components:
  button-primary:
    backgroundColor: '{colors.primary-charcoal}'
    textColor: '{colors.off-white-ground}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
    height: '36px'
  button-outline:
    backgroundColor: '{colors.off-white-ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
    height: '36px'
  button-outline-hover:
    backgroundColor: '{colors.soft-grey}'
  input:
    backgroundColor: '{colors.off-white-ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '4px 12px'
    height: '36px'
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
  category-tab:
    textColor: '{colors.muted-text}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: '6px 12px'
  category-tab-active-all:
    backgroundColor: '{colors.primary-charcoal}'
    textColor: '{colors.off-white-ground}'
  category-tab-active-matcha:
    backgroundColor: '{colors.matcha-jade}'
    textColor: '{colors.category-foreground}'
  category-tab-active-hojicha:
    backgroundColor: '{colors.hojicha-amber}'
    textColor: '{colors.category-foreground}'
  product-card:
    backgroundColor: '{colors.off-white-ground}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '16px'
---

# Design System: Matchoji

## Overview

**Creative North Star: "The Tasting Ledger"**

Matchoji is a working logbook, not a showcase. The ground is a neutral off-white, text is near-black, chrome is greyscale, and one workhorse sans (Lato) carries every word. Against that quiet ledger, exactly two colours do real work: jade marks matcha, amber marks hojicha. Category colour is data. It appears wherever a product or rating appears, so the scarce-matcha, abundant-hojicha contrast reads at a glance across a whole feed.

The system runs in Operate mode: dense enough to scan a grid of products, calm enough to read reviews. Components are shadcn primitives with the category layer applied on top; there is no bespoke component language beyond the category badge, the category-spined product card, and the star rating. Depth is minimal: product cards sit on a faint shadow and lift slightly on hover, and everything else is flat with hairline borders.

The confirmed rejection is the neutral-grayscale rating-app look where category is only a text label (the Vivino and Untappd clone pattern). Here, category is never a label alone.

**Key Characteristics:**

- Neutral off-white ground (#f9f9f9), near-black ink (#101010), greyscale chrome.
- Two functional category colours, jade and amber, both carrying white text at WCAG AA.
- One typeface, Lato, for everything. No display face.
- Flat surfaces with hairline borders; only product cards carry a resting shadow.
- Centred 1184px column with 24px gutters on every page.

## Colors

A greyscale ledger with two data colours that only ever mean "this is matcha" or "this is hojicha".

### Primary

- **Matcha Jade** (matcha-jade): The matcha category. Fills the matcha badge, the 4px left spine of matcha product cards, filled stars on matcha ratings (display and input), and the active Matcha tab. Darkened from the logo hex until white text clears 4.5:1.
- **Hojicha Amber** (hojicha-amber): The hojicha category, in exactly the same roles as jade. Darkened from the initial logo hex `#a9762c` for the same AA reason.
- **Category White** (category-foreground): Text on any jade or amber fill. Never place ink on a category fill.

### Neutral

- **Off-White Ground** (off-white-ground): Page, card, popover and dialog background. A neutral off-white, not warm.
- **Ink** (ink): All primary text.
- **Primary Charcoal** (primary-charcoal, hover primary-charcoal-hover): Default buttons ("Sign in with Google", "Log a tasting", form submit) and the active All tab. Neutral actions stay charcoal; they never take a category colour.
- **Soft Grey** (soft-grey, hover soft-grey-hover): Secondary and accent fills, outline-button hover, the active combobox row.
- **Muted Text** (muted-text): Brands, grade and region meta, review counts, reviewer names, inactive tabs, empty states, unfilled stars.
- **Hairline** (hairline): Every border: navbar and footer rules, card edges, tab rail, review dividers, dashed empty-state frames.
- **Input Stroke** (input-stroke) and **Focus Ring** (focus-ring): Field outlines and the focus halo, the latter used at 50% for the 3px ring.
- **Destructive** (destructive): Field errors and invalid outlines only.

Dark-mode values exist in `globals.css` (the scaffold's inverted greyscale), but the app ships `defaultTheme="light"`; jade and amber are fixed and do not change between themes.

### Named Rules

**The Category-Is-Data Rule.** Jade and amber appear only where a product's category is being expressed: badge, card spine, star fill, active category tab. They always come from `CATEGORY_STYLES`; no component hard-codes them. The one ambient use is the text-selection tint (jade at 25%), which is native to the world.

**The Charcoal Action Rule.** Buttons and other neutral actions are charcoal or outline. A jade "Submit" button would claim every rating is matcha.

## Typography

**Body Font:** Lato (via `next/font`, `--font-lato`), with the system sans stack as fallback.

**Character:** One sturdy humanist sans, used plainly. Hierarchy comes from size and weight (700 for page headings, 600 for titles and labels, 500 for tabs and buttons), never from a second family.

### Hierarchy

- **Headline** (700, 1.875rem, tight tracking): Page titles: "Discover" and the product name on detail.
- **Wordmark** (700, 1.25rem, tight tracking): "Matchoji" in the navbar.
- **Title** (600, 1.125rem): Section headings ("Rate it", "Reviews").
- **Card Title** (600, 1rem, line-height 1.25): Product name in cards and combobox rows.
- **Body** (400, 1rem): Page subtitles, brand line on detail.
- **Body Small** (400, 0.875rem): Review notes (capped at `max-w-prose`, about 65ch), meta, rating counts with tabular numerals, buttons and tabs (at 500).
- **Label** (600, 0.75rem): Category badges. Reviewer names and grade/region meta use the same size at 400 in muted text.

### Named Rules

**The One Voice Rule.** Lato only. No display face, no serif accent, no mono in shipped UI. This is Operate, not Persuade.

## Layout

Every page uses one centred column: max width 1184px (`max-w-site`), 24px horizontal gutter, 48px vertical padding. The navbar and footer share the same column and gutter, so edges line up from top to bottom.

- **Discover feed:** heading row (title and subtitle left, "Log a tasting" right, wrapping on narrow screens), then category tabs 24px below, then the product grid 32px below. Grid: 1 column, 2 from `sm` (640px), 3 from `lg` (1024px), 16px gaps.
- **Product detail:** a header block (name with inline badge, brand, grade/region, aggregate rating), then 40px below a two-column grid from `lg`: reviews in a fluid column and "Rate it" in a fixed 22rem column, 48px apart, with "Rate it" aligned to the top of its row rather than stretched. Below `lg` the columns stack with "Rate it" first, so a signed-in visitor can rate without scrolling past every review.
- **Rhythm:** 4 / 8 / 16 / 24 / 32 / 48px. Stacked form fields sit 16px apart; card internals use 8 to 12px steps.
- **Loading:** skeletons mirror the final layout (heading bars, tab bar, six card skeletons in the same grid), so nothing shifts on load.

## Elevation & Depth

The system is flat with hairlines, plus one small lift. Product cards are the only resting surface with a shadow; they deepen it on hover to signal that the whole card is a link. Dialogs use the primitive's larger overlay shadow. Inputs and outline buttons carry the near-invisible primitive shadow. Everything else (navbar, tabs, review rows, empty state) is separated by 1px hairline borders only.

### Shadow Vocabulary

- **Card rest** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): product cards at rest.
- **Card hover** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): product card hover, transitioned.
- **Dialog** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): the "Log a tasting" dialog.
- **Field** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): inputs and outline buttons.

### Named Rules

**The Hairline-First Rule.** Separate with 1px hairline borders before reaching for shadow. Only a clickable product card earns a lift.

## Shapes

Gently rounded throughout, from a 10px base radius: cards, tab rails, dialogs and empty-state frames use 10px; buttons, inputs, tabs, combobox lists and review photos use 8px. Pills (fully round) are reserved for category badges and the avatar/account trigger. Dashed hairline frames mark "nothing here yet" (empty feed, "add as new product").

**The Pinned Spine Rule.** Product cards carry a 4px left border in their category colour, with 1px hairlines on the other three sides. This side stripe was pinned by the brief as the card's category signal and overrides the usual ban on side-tab borders. It belongs to the product card only; do not put coloured side stripes on alerts, list rows or other containers.

## Components

### Buttons

Plain and confident, straight from the shadcn primitive.

- **Shape:** gently rounded (8px), 36px tall, 14px medium text.
- **Primary:** charcoal fill, off-white text, 90% opacity on hover. Pending submits show a spinning loader icon before the label.
- **Outline:** off-white with hairline border and field shadow; soft-grey fill on hover ("Load more (n left)").
- **Focus:** 3px ring in the focus-ring colour at 50%. Disabled drops to 50% opacity.

### Category Badge

- **Style:** full pill, category fill, white 12px semibold label ("Matcha" or "Hojicha"), 2px by 10px padding.
- **Placement:** top-right of product cards, inline after the product name on detail, at the end of combobox rows.

### Category Tabs

- **Style:** a segmented rail (hairline border, 10px radius, 4px inner padding) of link tabs: 14px medium text, 8px radius.
- **State:** inactive tabs are muted text that darkens to ink on hover. The active tab fills with its own category colour (jade for Matcha, amber for Hojicha) and charcoal for All. Active state is exposed with `aria-current="page"`.

### Product Card

The signature component.

- **Corner Style:** 10px radius.
- **Background:** off-white, matching the ground; the card is defined by hairline, spine and shadow.
- **Border:** 4px category spine on the left, 1px hairline elsewhere.
- **Shadow Strategy:** card rest, then card hover (see Elevation).
- **Internal Padding:** 16px. Name and brand top-left, badge top-right, grade and region as a muted dot-separated line, star rating last.
- **Interaction:** the whole card is one link; focus shows a 2px ring with offset.

### Star Rating

- **Display:** five 16px outline stars. Filled stars take the category colour; unfilled stars are muted. Followed by the average to one decimal and the review count in small muted tabular numerals. Unrated products read "Not yet rated".
- **Input:** five 28px star buttons in a radiogroup, filling in the category colour on hover preview and selection.

### Inputs / Fields

- **Style:** transparent fill, input-stroke border, 8px radius, 36px tall, field shadow.
- **Focus:** border shifts to focus-ring with a 3px ring at 50%.
- **Error:** destructive border and a faint destructive ring; inline messages sit under the field.
- **Combobox:** results list as hairline-divided rows in an 8px-radius frame; the active row takes the soft-grey fill.

### Navigation

- **Navbar:** sticky, full-width, off-white with a bottom hairline, at least 64px tall. Bold wordmark left; auth control right ("Sign in with Google" primary button when signed out, round avatar menu when signed in).
- **Footer:** top hairline, muted 14px "Matchoji", same column and gutter.

### Review Item

- **Style:** rows divided by bottom hairlines (none on the last), 16px vertical padding. Category-filled stars left, muted reviewer name right, notes below in small text capped near 65ch, with an underlined "Read more" / "Show less" toggle for long notes. Optional photo is a 160px square crop at 8px radius.

## Do's and Don'ts

### Do:

- **Do** pull every jade and amber use from `CATEGORY_STYLES`, so badge, spine, star and tab can never disagree.
- **Do** keep white text on both category fills; both were darkened specifically to clear 4.5:1.
- **Do** keep neutral actions charcoal or outline, whatever the surrounding category.
- **Do** use the 1184px column with 24px gutters and 48px vertical padding on every page.
- **Do** make loading skeletons match the final layout's grid and spacing.
- **Do** stack the detail page's "Rate it" column above reviews below `lg`.

### Don't:

- **Don't** use jade or amber decoratively, for status, or for anything other than a product's category (the 25% jade selection tint is the only ambient exception).
- **Don't** add a display face, second family or mono to shipped UI; Lato carries everything.
- **Don't** reduce category to a text label alone; any product or rating shown must carry its colour.
- **Don't** add coloured side stripes outside the product card.
- **Don't** add resting shadows to non-clickable containers; separate them with hairlines.
- **Don't** describe or tint the ground as warm; it is neutral off-white (#f9f9f9).
