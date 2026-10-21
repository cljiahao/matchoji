# Tasting Journal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Matchoji feel like a Vivino / coffee-tracker hybrid — richer tasting entries, crowd summaries on product pages, a personal journal, real discovery — with a minimalist visual refresh.

**Architecture:** Three PRs on fresh branches from `main`. All aggregation (distribution, taste profile, notes, prep, journal stats) is pure TypeScript over already-fetched rows, unit-tested; Supabase gains one migration (new `reviews` columns + `wishlist`). Discover state lives in URL search params and renders on the server.

**Tech Stack:** Next.js 16 App Router (async `params`/`searchParams`), Supabase JS, shadcn/ui + Radix, TanStack Query v5, React Hook Form + Zod v4, Tailwind v4, Vitest + RTL (jsdom per file via `// @vitest-environment jsdom`).

**Spec:** `docs/superpowers/specs/2026-10-21-tasting-journal-redesign-design.md`

## Global Constraints

- No new runtime dependencies.
- Lato only; category colours `--matcha #5c7a4f`, `--hojicha #8f6224` with white foreground; applied only via `CATEGORY_STYLES` (`src/features/products/lib/category-styles.ts`).
- Page ground `#f6f4ef`; cards/panels `#ffffff`.
- Score numeral: Lato 900, `tabular-nums`, 48px on product page, 20px on cards.
- Flavour notes ≤ 6 per review; taste attributes integers 1–5; dose_g 0–50; water_ml 0–1000; water_temp_c 0–100.
- Matcha notes: `umami, grassy, creamy, sweet, vegetal, marine, nutty, floral, bitter, astringent`. Hojicha notes: `roasty, caramel, nutty, chocolate, woody, smoky, sweet, earthy, toasted-rice, malty`.
- Prep methods: `usucha, koicha, latte, iced, cold-brew, steeped, other`.
- Discover URL params: `q`, `category` (`matcha|hojicha`), `region` (uuid), `sort` (`top|reviewed|newest`, default `top`).
- Motion: only taste-profile bars and rating-distribution bars grow on first view, 200ms ease-out, none under `prefers-reduced-motion`.
- Banned: eyebrow/kicker labels, gradients, glass, emoji or unicode glyphs as icons (use lucide or authored SVG), side-stripe borders > 1px.
- Every PR: `pnpm check`, `pnpm test`, changed-line coverage ≥ 80%, CHANGELOG entry, README updates for touched folders, `.claude/ci-gates.sh {changelog,readme,comments} main` all pass before opening.

## Review Focus

1. Product whose reviews never set a taste attribute / prep detail → those sections are hidden, never `NaN` or empty bars. (Task 8 test `summarizeReviews omits profile with no attributes`.)
2. Search `q` of only spaces or PostgREST syntax (`,()`) → behaves as no query, no 500. (Task 3 test `parseDiscoverParams drops blank q` + service test reusing `buildSearchFilter`.)
3. Garbage URL params (`?sort=foo&region=abc&category=sencha`) → defaults, no error. (Task 3 test `parseDiscoverParams ignores invalid values`.)
4. Flavour notes not in the product's category list, or more than 6 → rejected by schema; picker disables extra chips at 6. (Task 5 schema test, Task 7 picker test.)
5. Journal visited signed-out or with an expired session → sign-in prompt, not a crash. (Task 12 page test `journal signed out shows sign-in`.)

---

## PR 1 — Visual refresh + discover (branch `feat/redesign-discover`)

### Task 1: Tokens and app shell

**Files:**

- Modify: `src/app/globals.css` (light `--background: #f6f4ef`, `--card: #ffffff`, `--popover: #ffffff`)
- Modify: `src/components/layout/navbar.tsx`, `src/features/auth/components/user-menu.tsx`
- Modify: `src/app/(public)/page.tsx` (header CTA moves to navbar; empty-state dialog keeps `restoresDraft={false}`)
- Test: `src/components/layout/navbar.test.tsx`

**Interfaces:**

- Produces: `Navbar` renders links `Discover` (`/`) and `Journal` (`/journal`), a `LogTastingDialog` (the one that `restoresDraft`), and `AuthStatus`. `UserMenu` gains `Discover`/`Journal` items shown below `sm`.

- [ ] Step 1: Test `navbar shows Discover and Journal links and the log button` (hrefs `/`, `/journal`; button name `Log a tasting`), and `navbar marks the current route` (`aria-current="page"` on Discover when `usePathname()` is `/`).
- [ ] Step 2: Run `pnpm exec vitest run src/components/layout/navbar.test.tsx` → FAIL.
- [ ] Step 3: Implement; links hidden below `sm` (`hidden sm:flex`), log button always visible (icon-only `Plus` below `sm`, accessible name kept).
- [ ] Step 4: Re-run → PASS; update `test/app/pages.test.tsx` discover expectations if the header CTA assertion moved.
- [ ] Step 5: Commit `feat(shell): paper ground, nav links and global log button`.

### Task 2: Score numeral, image well, new product card

**Files:**

- Create: `src/features/products/components/score-numeral.tsx`, `product-image-well.tsx`, `leaf-mark.tsx`
- Modify: `src/features/products/components/product-card.tsx`, `star-rating-display.tsx`, `components/index.ts`
- Test: `src/features/products/components/products-components.test.tsx` (extend)

**Interfaces:**

- Produces: `ScoreNumeral({ value: number | null; size: 'sm' | 'lg' }): JSX` — renders `value.toFixed(1)` or `–` for null; `ProductImageWell({ imageUrl: string | null; category: ProductCategory; name: string; className?: string })` — `<img alt={name}>` when url, else category-tinted field (`bg-matcha/10` / `bg-hojicha/10`) with `LeafMark` in category colour, `aria-hidden`.
- `CATEGORY_STYLES[c]` gains `tint: 'bg-matcha/10' | 'bg-hojicha/10'` and `text: 'text-matcha' | 'text-hojicha'`; `border` key removed.

- [ ] Step 1: Tests: `ScoreNumeral renders one decimal and a dash for null`; `ProductImageWell shows the photo when present`; `ProductImageWell tints by category without a photo`; `ProductCard shows image well, score numeral and review count, and no side border` (assert no class matching `/border-l-4/`).
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement; card layout: image well 4:3 top, body `p-4` with name/brand, region line, then `ScoreNumeral sm` + stars + `(n)`; whole card is the link, `focus-visible` ring kept.
- [ ] Step 4: Run products tests → PASS.
- [ ] Step 5: Commit `feat(products): score numeral and category image well cards`.

### Task 3: Discover search, region filter and sort

**Files:**

- Create: `src/features/products/lib/discover-params.ts` (+ `.test.ts`), `src/features/products/lib/sort-products.ts` (+ `.test.ts`), `src/features/products/components/discover-toolbar.tsx`
- Modify: `src/features/products/api/products-service.ts` (`listProducts`), `products-service.test.ts`, `src/app/(public)/page.tsx`, `test/app/pages.test.tsx`

**Interfaces:**

- Produces: `type DiscoverSort = 'top' | 'reviewed' | 'newest'`; `interface DiscoverFilters { q?: string; category?: ProductCategory; regionId?: string; sort: DiscoverSort }`; `parseDiscoverParams(params: Record<string, string | string[] | undefined>): DiscoverFilters` (Zod, invalid → omitted, sort default `top`, `q` trimmed and dropped when `buildSearchFilter(q)` is null); `sortProducts(products: Product[], sort: DiscoverSort): Product[]` (`top` = existing `sortByRating`; `reviewed` = reviewCount desc then avg desc; `newest` = createdAt desc); `listProducts(supabase, filters: DiscoverFilters): Promise<Product[]>` (applies `or(buildSearchFilter(q))`, `eq('category')`, `eq('region_id')`, then `sortProducts`).
- `DiscoverToolbar({ filters: DiscoverFilters; regions: {id,name}[] })` — GET `<form action="/">` with search input `name="q"`, region `Select` and sort `Select` that submit on change (hidden inputs preserve the others), category tabs keep `q/region/sort` in their hrefs.

- [ ] Step 1: Tests: `parseDiscoverParams ignores invalid values` (`{sort:'foo',region:'abc',category:'sencha'}` → `{sort:'top'}`); `parseDiscoverParams drops blank q` (`'  ,() '` → no `q`); `parseDiscoverParams keeps valid values`; `sortProducts reviewed puts most-reviewed first`; `sortProducts newest`; service: `listProducts applies search, category and region filters`; page: `discover shows a no-results state with a clear-filters link when a search matches nothing` (copy `No teas match “<q>”.`, link `/`).
- [ ] Step 2: Run → FAIL.
- [ ] Step 3: Implement; page loads `listRegions` alongside products; empty catalogue (no filters) keeps the existing `EmptyState`.
- [ ] Step 4: Run → PASS.
- [ ] Step 5: Commit `feat(discover): search, region filter and sort in the URL`.

### Task 4: PR 1 finish

- [ ] Step 1: Run the impeccable detector on changed UI (`impeccable detect --json src/app/(public) src/features/products src/components/layout`), fix mechanical findings.
- [ ] Step 2: Capture desktop (1440) and mobile (390) of `/` and a product page into `.impeccable/review/`; check against the spec's visual direction; one fix batch max.
- [ ] Step 3: Update `DESIGN.md` + `.impeccable/design.json` (ground/card tokens, score numeral, image well, nav; remove "Pinned Spine" and "neutral ground" rules) via the impeccable documenter.
- [ ] Step 4: CHANGELOG + READMEs; gates; push; open PR.

---

## PR 2 — Tasting entry + product page (branch `feat/tasting-entry`)

### Task 5: Migration, types and schema

**Files:**

- Create: `supabase/migrations/20261021000000_tasting_journal.sql`
- Create: `src/features/reviews/lib/tasting-vocab.ts` (+ `.test.ts`)
- Modify: `src/integrations/supabase/database.types.ts`, `src/features/reviews/schemas/review.schema.ts` (+ create `review.schema.test.ts`), `supabase/migrations/README.md`

**Interfaces:**

- Produces: `FLAVOR_NOTES: Record<ProductCategory, readonly string[]>`, `PREP_METHODS: readonly PrepMethod[]`, `type PrepMethod`, `PREP_METHOD_LABELS: Record<PrepMethod, string>`, `noteLabel(slug: string): string` (`toasted-rice` → `Toasted rice`), `TASTE_ATTRIBUTES = ['sweetness','umami','bitterness','body'] as const`, `type TasteAttribute`.
- `reviewSchema` adds optional `flavorNotes: string[]` (max 6, unique, each in the union of both lists), `sweetness|umami|bitterness|body: int 1–5 optional`, `prepMethod: enum(PREP_METHODS) optional`, `doseG: number 0–50 optional`, `waterMl: int 0–1000 optional`, `waterTempC: int 0–100 optional`, `tastedOn: YYYY-MM-DD string optional (≤ today)`. `reviewSchemaFor(category): ZodType` narrows `flavorNotes` to that category's list.
- SQL per spec "Data model changes", including `wishlist` with RLS owner select/insert/delete, `check` constraints mirroring the ranges, `cardinality(flavor_notes) <= 6`.

- [ ] Step 1: Tests: `reviewSchema accepts a full entry`; `reviewSchemaFor rejects a note from the other category`; `reviewSchema rejects 7 notes and duplicates`; `reviewSchema rejects out-of-range dose, water and temperature`; `noteLabel formats slugs`.
- [ ] Step 2: Run → FAIL. Step 3: implement. Step 4: Run → PASS.
- [ ] Step 5: Commit `feat(reviews): tasting profile schema and migration`.

### Task 6: Persist and read the new fields

**Files:**

- Modify: `src/features/reviews/types.ts`, `api/reviews-mutations.ts`, `api/reviews-service.ts`, `hooks/use-log-review.mutation.ts`, matching tests

**Interfaces:**

- `Review` gains `flavorNotes: string[]`, `profile: Partial<Record<TasteAttribute, number>>`, `prep: { method: PrepMethod | null; doseG: number | null; waterMl: number | null; waterTempC: number | null }`, `tastedOn: string`.
- `createReview` writes snake_case columns, `null` for unset; `listReviews` selects and maps them (numeric strings coerced like `applyRating`).

- [ ] Step 1: Tests: `createReview inserts profile, notes and prep columns`; `listReviews maps profile and prep, omitting unset attributes`. Step 2: FAIL. Step 3: implement. Step 4: PASS.
- [ ] Step 5: Commit `feat(reviews): store taste profile, notes and preparation`.

### Task 7: Tasting form

**Files:**

- Create: `src/features/reviews/components/flavor-note-picker.tsx`, `taste-profile-input.tsx`, `prep-fields.tsx` (+ one `tasting-inputs.test.tsx`)
- Modify: `rate-product-form.tsx`, `rate-product-form.test.tsx`

**Interfaces:**

- `FlavorNotePicker({ category; value?: string[]; onChange?(v: string[]) })` — toggle buttons (`aria-pressed`), unpressed chips disabled at 6 with a `6 of 6` counter.
- `TasteProfileInput({ attribute: TasteAttribute; value?: number; onChange?(v: number | undefined) })` — radiogroup of 5; clicking the selected step clears it.
- `PrepFields` — uses `useFormContext`; method chips + three number inputs with unit suffixes; rendered inside a native `<details>` labelled `How you made it`.
- `RateProductForm` uses `reviewSchemaFor(product.category)`; default `tastedOn` = today (local date); draft already carries all fields via the schema.

- [ ] Step 1: Tests: `FlavorNotePicker caps at six`; `TasteProfileInput toggles off on second click`; `RateProductForm submits notes, profile and prep` (insert args contain `flavor_notes`, `sweetness`, `prep_method`, `dose_g`); `RateProductForm still submits with stars only`.
- [ ] Step 2: FAIL. Step 3: implement. Step 4: PASS.
- [ ] Step 5: Commit `feat(reviews): flavour notes, taste profile and prep in the rating form`.

### Task 8: Review aggregates

**Files:**

- Create: `src/features/reviews/lib/summarize-reviews.ts` (+ `.test.ts`)

**Interfaces:**

- `summarizeReviews(reviews: Review[]): ReviewSummary` where `ReviewSummary = { distribution: Record<1|2|3|4|5, number>; profile: { averages: Partial<Record<TasteAttribute, number>>; contributors: number } | null; topNotes: { note: string; count: number }[] /* top 6, ties by first appearance */; prep: { method: PrepMethod; doseG: number | null; waterMl: number | null; waterTempC: number | null } | null /* method = mode; numbers = median when ≥ 2 values */; photos: string[] }`.

- [ ] Step 1: Tests: `summarizeReviews counts the distribution`; `summarizeReviews omits profile with no attributes`; `summarizeReviews averages only reviews that set an attribute`; `summarizeReviews medians prep numbers only with two or more values`; `summarizeReviews returns null prep without a method`; `summarizeReviews ranks top notes`.
- [ ] Step 2: FAIL. Step 3: implement. Step 4: PASS.
- [ ] Step 5: Commit `feat(reviews): summarise distribution, profile, notes and prep`.

### Task 9: Product page and review display

**Files:**

- Create: `src/features/reviews/components/taste-profile-bars.tsx`, `rating-distribution.tsx`, `product-insights.tsx`, `prep-summary.tsx` (+ `product-insights.test.tsx`)
- Modify: `review-item.tsx` (+ test), `src/app/(public)/products/[id]/page.tsx`, `loading.tsx`, `test/app/pages.test.tsx`

**Interfaces:**

- `TasteProfileBars({ values: Partial<Record<TasteAttribute, number>>; category; compact?: boolean })` — `<meter>`-semantics bars (`role="meter"`, `aria-valuenow`), width `value/5`, grow animation per Global Constraints.
- `RatingDistribution({ distribution; category })`; `PrepSummary({ prep })` → `Usucha · 2g · 70ml · 80°C` (omit unset parts); `ProductInsights({ summary: ReviewSummary; category })` renders sections only when data exists.
- Page hero: `ProductImageWell` (lg), name, badge, meta line, `ScoreNumeral lg` + stars + count.

- [ ] Step 1: Tests: `ProductInsights hides empty sections`; `TasteProfileBars exposes values as meters`; `PrepSummary formats and skips unset parts`; `ReviewItem shows notes, compact profile and prep line`; page: `product page shows score, distribution and most noticed notes`.
- [ ] Step 2: FAIL. Step 3: implement. Step 4: PASS.
- [ ] Step 5: Commit `feat(products): crowd summary on the product page`.

### Task 10: PR 2 finish

- [ ] Detector, captures, one fix batch, DESIGN.md components (taste profile bars, distribution), CHANGELOG, READMEs, gates, PR. PR description tells the user to run `20261021000000_tasting_journal.sql` before merging.

---

## PR 3 — Journal + want to try (branch `feat/journal`)

### Task 11: Wishlist data layer

**Files:**

- Create: `src/features/journal/api/wishlist-service.ts` (+ test), `src/features/journal/hooks/use-wishlist.ts`, `src/features/journal/index.ts`, `types.ts`

**Interfaces:**

- `listWishlist(supabase, userId): Promise<ProductSummary[]>`, `isWishlisted(supabase, userId, productId): Promise<boolean>`, `addToWishlist(supabase, userId, productId): Promise<void>` (upsert, ignore duplicate), `removeFromWishlist(...)`; `useWishlistToggle(productId): { saved: boolean; toggle(): void; pending: boolean }` (optimistic, rolls back + toast on error).

- [ ] Tests: `addToWishlist upserts`, `removeFromWishlist deletes by user and product`, `listWishlist maps products`, hook `toggle rolls back on error`. FAIL → implement → PASS → commit `feat(journal): want-to-try data layer`.

### Task 12: Journal page

**Files:**

- Create: `src/features/journal/lib/journal-stats.ts` (+ test), `src/features/journal/api/journal-service.ts` (+ test), `src/features/journal/components/*` , `src/app/(public)/journal/page.tsx`, `loading.tsx`
- Modify: `test/app/pages.test.tsx`

**Interfaces:**

- `listMyReviews(supabase, userId): Promise<(Review & { product: ProductSummary })[]>`; `computeJournalStats(entries): { count: number; avgStars: number | null; split: { matcha: number; hojicha: number }; topNotes: string[] /* 3 */ }`; `groupByMonth(entries): { month: string /* 'October 2026' */; entries }[]` (by `tastedOn`, newest first).
- Page reads the user with server `supabase.auth.getUser()`; signed-out → explanation + `SignInButton`; empty → first-tasting CTA; else stats strip, timeline, want-to-try list with remove buttons.

- [ ] Tests: `computeJournalStats` (empty → count 0, avg null), `groupByMonth orders newest first`, page `journal signed out shows sign-in`, `journal lists tastings by month and the want-to-try list`. FAIL → implement → PASS → commit `feat(journal): personal tasting journal page`.

### Task 13: Want-to-try toggle

**Files:**

- Create: `src/features/journal/components/want-to-try-button.tsx` (+ test)
- Modify: product page hero

- [ ] Tests: `WantToTryButton toggles saved state` (`aria-pressed`), `signed out starts sign-in back to the product`. FAIL → implement → PASS → commit `feat(journal): want-to-try toggle on products`.

### Task 14: PR 3 finish + impeccable finish review

- [ ] Detector, captures (journal, product, discover; desktop + mobile), spawn `impeccable-finish-reviewer` against the spec's visual direction, act on its disposition, documenter updates DESIGN.md, CHANGELOG, READMEs, gates, PR.
