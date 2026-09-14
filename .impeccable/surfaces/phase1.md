---
version: 1
slug: 'phase1'
primary_target: 'phase1'
related_targets: ['src/app/(public)/page.tsx', 'src/app/(public)/products']
---

## Direction contract

THESIS: Category (matcha vs hojicha) is data, not decoration — jade and amber tag every product/rating so the "scarce matcha, abundant hojicha" contrast reads at a glance across the whole app. Refuses the category-default neutral-grayscale rating-app look (Vivino/Untappd clones) where category is just a text label.

OWN-WORLD: Restrained-to-Committed hybrid: neutral warm-white ground (`--background`), near-black text, single workhorse sans (Lato, already scaffolded) for all UI text — no display face, this is Operate not Persuade. Two functional accent colors carry category identity everywhere it appears (badges, star-rating fill, product-card left border): jade `#5c7a4f` = matcha, amber `#a9762c` = hojicha (both already committed via the logo). Cards use the existing `CustomCard`/shadcn primitives — no new component language, just consistent category-color application on top of them.

STORY: A visitor lands on the discover feed, sees products color-tagged by category at a glance, opens one to read reviews and see the aggregate rating, and (once signed in) submits their own rating with notes/photo — or searches-and-creates inline if the product isn't in the catalog yet.

FIRST VIEWPORT: Discover feed — a card grid (2-3 cols desktop, 1 col mobile), each card: category-color left border + small badge, product name/brand, star rating + review count, region if set. A top bar: app name, category filter tabs (All / Matcha / Hojicha), sign-in button (top-right) when signed out.

FORM: Direct pragmatic decision — concept-seed dice-roll/mockup ceremony skipped by explicit user choice (lightweight process for an Operate-mode MVP with brand colors already committed). No seed key.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Scope and boundaries

- Fidelity: production-ready screens, not exploration — this is the real Phase 1 build.
- Breadth: four screens/flows — discover feed, product detail (+ reviews + rate form), sign-in, add/rate combined flow (search-or-create inline).
- Named targets: `src/app/(public)/page.tsx` (discover feed replaces current placeholder home), `src/app/(public)/products/[id]/page.tsx` (product detail), sign-in via Supabase Auth Google OAuth (no dedicated screen — a button that redirects), rate/add flow lives on the product detail page + a "log a new one" entry point on the feed.
- Anti-goals: no marketplace/checkout UI, no vendor dashboard, no native app, no dark-mode-specific redesign beyond the scaffold's existing light/dark tokens.

## States and ranges

- Empty discover feed (greenfield, zero products): show an empty state with a clear "log your first hojicha or matcha" CTA, not a blank grid.
- Loading: skeleton cards on the feed, spinner on submit.
- Error: toast on failed rating submit / failed sign-in; inline field errors on the rate form (Zod validation — stars required 1-5, product name required if creating new).
- Signed-out visitor on product detail: can read everything; the rate form renders but its submit routes to Google sign-in first (no dead-end, no hidden form).
- Overflow: long review notes truncate with "read more" on the card, full text on detail; many reviews on one product paginate or infinite-scroll (simple "load more" button is enough for Phase 1 volume).

## Interaction and layout

- Category filter (All/Matcha/Hojicha) as tabs (shadcn `tabs` primitive, already installed) above the feed grid.
- Product card: click anywhere navigates to detail page.
- Rate form: shadcn `form` + `field` + `input`/`textarea`/star-rating control (custom, small — 5 clickable icons) + photo upload (single file input, optional).
- Search-or-create: a combobox-style search input at the top of the rate flow; typing filters existing products by name/brand; no match shows an inline "add '<query>' as a new product" affordance that expands the add-product fields (name, brand, category, grade, region) right there, then proceeds to the rating fields.

## Constraints and open decisions

- Platform: Next.js App Router, web only, existing shadcn/ui + TanStack Query + Supabase stack — no new dependencies beyond a star-rating input (build it small and custom, not a new package) and a Supabase JS client (`@supabase/supabase-js`, `@supabase/ssr`) which is not yet installed.
- Accessibility: standard semantic HTML, sufficient contrast for jade/amber against the warm-white ground (verify at build time), keyboard-navigable tabs/forms.
- Open decision left to the builder: exact star-rating control implementation (five buttons vs. a slider) — five clickable star buttons is the more familiar Vivino-style pattern, use that unless it proves awkward.
