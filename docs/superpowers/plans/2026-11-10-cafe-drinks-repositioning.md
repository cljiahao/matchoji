# Café-drink repositioning: implementation plan

> **For agentic workers:** each slice below is one builder session and one PR. Work through your slice's tasks in
> order with TDD. Steps use checkbox (`- [ ]`) syntax. Read the spec before starting.

**Goal:** turn Matchoji into "the trusted guide to hojicha and matcha drinks in Singapore and JB, rated drink by
drink". This adds cafés, drinks, drink reviews and trusted tasters, and cleans up the surfaces that no longer fit.

**Architecture:**

- One additive Supabase migration adds `cities`, `cafes` and `drinks`, and extends `reviews`, `profiles` and
  `notifications`.
- A new feature module, `src/features/cafes/`, owns cafés, drinks, their pages and services. It depends on
  `reviews` through its `index.ts`, never the reverse.
- The log dialog becomes a widget that composes the tea flow (from `reviews`) and the drink flow (from `cafes`).

**Tech stack:** Next.js 16 App Router (async `params`/`searchParams`/`cookies`), Supabase Postgres + RLS, Zod v4,
TanStack Query v5, Vitest, PGlite DB tests, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-11-10-cafe-drinks-repositioning-design.md`. Slice 1 commits it; until then
it's at `/private/tmp/claude-502/-Users-clarencelee-Desktop-matchoji/6d68cde5-5a6d-48ae-9143-d46f1dabe3b3/scratchpad/2026-11-10-cafe-drinks-repositioning-design.md`.
§7.5 (orchestrator's calls) and §9 (owner decisions) are binding.

## Global constraints

- Cities: `singapore` (Singapore, SG, SGD) and `johor-bahru` (Johor Bahru, MY, MYR). Cities are rows, not
  hard-coded unions, except the `CitySlug` TS type generated from the seed.
- Drink `base`: `hojicha | matcha`. `style`: `latte | straight | iced_latte | float | other`. `serving`:
  `hot | iced | both`. Drinks only, no desserts.
- `disclosure`: `none | invited | gifted | paid`. The labels shown are "Invited", "Gifted" and "Paid partnership".
  `none` shows nothing.
- Instagram post URL regex: `^https://www\.instagram\.com/(p|reel)/[A-Za-z0-9_-]+/?$`. Handle regex:
  `^[A-Za-z0-9._]{1,30}$`, stored without `@`.
- Bio: at most 280 characters.
- Pending caps: 10 pending cafés and 20 pending drinks per user.
- Top-list threshold: at least 1 taster review **or** at least 3 community reviews (latest review per person).
- Disclosed reviews **count** in the taster score and `/top`. Every drink card and drink page shows
  "n of m taster reviews were gifted/paid" when n > 0.
- Taster and community scores are never blended.
- Constitution:
  - Products never reference cafés or drinks.
  - Each new table gets an `audit_row_change` trigger.
  - New services need integration tests (success, error, edge).
  - New routes need 401/200/error tests where auth applies.
  - No `any`, no `@ts-ignore`, Zod at every boundary.
- Never fabricate cafés, reviews or scores. Seed only the two cities.
- Keep label scanning and Sentry inert. Leave the marketplace tables and code in place.
- Each PR updates the `CHANGELOG.md` `[Unreleased]` section, the root `README.md`, and the `README.md` of every
  folder it changes (the readme-freshness gate).
- Missing-table fallback: `MISSING_TABLE = new Set(['42P01', 'PGRST205'])`, the same pattern as
  `src/features/shops/api/shops-service.ts:14`. On a missing table, return an empty result and never throw.

## Review focus

1. **IG link to a merged or renamed café or drink.** It must redirect to the surviving page and never 404 (§7.5.8).
   Test in Slice 3.
2. **A taster's drink review without an IG link, or a non-taster sending `instagram_url`/`disclosure`.** The DB must
   refuse both. Test in Slice 1, in `test/db`.
3. **The same person re-logging a drink.** The score and count change by at most one person. Test in Slice 1, on
   the `drink_ratings` view.
4. **Private-profile community reviews.** They count in `community_count` but aren't listed, and a taster can't go
   private. Test in Slice 1.
5. **Existing tea features after `reviews.product_id` becomes nullable.** Product ratings, the journal, feed,
   notifications, taste match, year-in-tea, export and admin reports must not crash or show null tea rows on drink
   reviews. Test in Slice 2.

---

## Slice order and parallelism

| Slice | Name                                                                                          | Depends on                | Can run alongside    |
| ----- | --------------------------------------------------------------------------------------------- | ------------------------- | -------------------- |
| S1    | Schema migration, types and DB tests, plus commit spec and plan                               | –                         | S8                   |
| S8    | Cleanup sweep (no nav, footer or home changes)                                                | –                         | S1                   |
| S2    | Make review consumers drink-safe, plus disclosure/IG UI pieces                                | S1 merged **and applied** | S5                   |
| S5    | Admin tools: cafés, drinks, tasters, merges                                                   | S1 merged and applied     | S2                   |
| S3    | Cafés feature: services, `/cafes`, café page, drink page, `/c/` redirect, OG, sitemap, routes | S2                        | –                    |
| S4    | Rating flow: log dialog widget, add café or drink, drink review form                          | S3                        | S6                   |
| S6    | Taster profiles, `/tasters`, "How we rate", account profile fields                            | S3                        | S4                   |
| S7    | Home, navbar, tab bar, footer, `/top` drinks, city switch                                     | S4, S6                    | –                    |
| S9    | Protected docs: AGENTS.md "Phase 1 only" and CONSTITUTION phase rule                          | S7                        | needs owner approval |

The owner applies the S1 migration in the Supabase SQL editor after S1 merges and before S2, S3 or S5 merge
(§7.5.11). Merging any later slice waits for that.

---

## S1: Schema migration

**Files:**

- Create: `supabase/migrations/20261110000000_cafes_and_drinks.sql`
- Create: `test/db/cafes-and-drinks.test.ts`
- Modify: `supabase/migrations/README.md`
- Modify: `src/integrations/supabase/database.types.ts` (hand-written: add tables, views, functions and new
  columns; keep `pnpm schema:check` passing against the migration)
- Create: `docs/superpowers/specs/2026-11-10-cafe-drinks-repositioning-design.md` (copy from the scratchpad)
- Create: `docs/superpowers/plans/2026-11-10-cafe-drinks-repositioning.md` (copy this file)
- Modify: `docs/superpowers/specs/2026-09-14-matchoji-design.md`: add a one-line "Update 2026-11-10" pointer to the
  new spec at the top of §5.

**Produces (DB contract later slices rely on):**

```
cities(slug pk text, name text, country text check in ('SG','MY'), currency text check in ('SGD','MYR'), sort_order int)
cafes(id uuid pk, slug text unique not null, name text not null (<=120), city_slug text fk cities, area text (<=80),
      address text (<=300), lat double precision, lng double precision, instagram_handle text (handle regex),
      website_url text (https only), status text ('pending'|'approved'|'rejected') default 'pending',
      added_by uuid fk profiles on delete set null default auth.uid(), review_note text (<=500),
      merged_into uuid fk cafes, reviewed_at timestamptz, created_at, updated_at)
drinks(id uuid pk, cafe_id uuid fk cafes on delete cascade, slug text not null, name text not null (<=120),
       base text, style text, serving text, price numeric(7,2) >= 0 null, currency text, photo_url text (https),
       photo_credit text (<=200), tea_product_id uuid fk products on delete set null, status, added_by, review_note,
       merged_into uuid fk drinks, reviewed_at, created_at, updated_at,
       unique (cafe_id, slug), unique index on (cafe_id, lower(btrim(name))))
reviews: product_id nullable; + drink_id uuid fk drinks on delete cascade; check num_nonnulls(product_id, drink_id) = 1;
         + instagram_url text (IG regex); + disclosure text not null default 'none' (enum above);
         + tea_strength smallint 1-5; + roast smallint 1-5; + by_trusted_taster boolean not null default false;
         index reviews_drink_id_idx
profiles: + is_trusted_taster boolean not null default false (NO column grant); + instagram_handle (regex, granted);
          + bio text <=280 (granted)
notifications: product_id nullable; + drink_id uuid fk drinks on delete cascade;
               check not (product_id is not null and drink_id is not null);
               kind check widened with 'cafe_reviewed','drink_reviewed'
views:  drink_ratings(drink_id, taster_count, taster_avg numeric(3,2), taster_disclosed_count, community_count,
                      community_avg numeric(3,2))  -- approved drinks at approved cafés only; latest review per person
        cafe_ratings(cafe_id, drink_count, taster_count, taster_avg, community_count, community_avg)
functions (security definer, search_path ''):
  slugify(text) returns text                                   -- lowercase, ascii, [a-z0-9-], trimmed dashes
  can_engage_cafe(cafe uuid) / can_engage_drink(drink uuid) returns boolean  -- approved, or pending and added_by = auth.uid()
  drink_reviews(drink uuid) returns table(... same columns as product_reviews ..., drink_id, instagram_url, disclosure,
                tea_strength, roast, by_trusted_taster)        -- latest per person; hides private authors
  review_cafe(cafe uuid, decision text, note text default null) returns void        -- require_admin()
  review_drink(drink uuid, decision text, note text default null) returns void      -- require_admin()
  merge_cafe(duplicate uuid, keep uuid) returns void   -- moves drinks (on slug clash, merge_drink into the keeper's), sets merged_into
  merge_drink(duplicate uuid, keep uuid) returns void  -- repoints reviews.drink_id and notifications.drink_id, sets merged_into
  set_trusted_taster(person uuid, value boolean) returns void  -- require_admin(); granting also sets is_public = true
```

Triggers:

- `cafes_set_slug` and `drinks_set_slug` (before insert):
  - Slug = `slugify(name || ' ' || coalesce(area,''))` for cafés and `slugify(name)` for drinks (scoped per café).
  - On a collision, append `-2`, `-3` and so on.
  - Any client-supplied slug is ignored.
  - `slug` is never in an update grant, so it's immutable.
- `drinks_set_currency` (before insert): copies the currency from the café's city.
- `reviews_stamp_taster` (before insert): sets `by_trusted_taster` from `profiles.is_trusted_taster` of `user_id`,
  ignoring the client's value.
- `reviews_taster_rules` (before insert or update):
  - Raise if `instagram_url` or `disclosure <> 'none'` is set on a review where `by_trusted_taster` is false.
  - Raise if a drink review has `by_trusted_taster` true and a null `instagram_url`.
- `profiles_taster_stays_public` (before update): raise if `is_public` turns false while `is_trusted_taster` is true.
- `limit_pending_cafes` and `limit_pending_drinks` (before insert): count this user's `status = 'pending'` rows and
  raise past 10 or 20.
- `cafes_notify_review` and `drinks_notify_review` (after update of status): mirror `notify_on_tea_review`, using
  kinds `cafe_reviewed` and `drink_reviewed`.
- `notify_on_like` and `notify_on_comment`: recreate them to carry `drink_id` as well as `product_id`.
- `audit_cities`, `audit_cafes` and `audit_drinks`: `audit_row_change`.
- `updated_at` touch triggers on cafes and drinks.

RLS:

- cities: select for everyone, no writes.
- cafes and drinks:
  - Select: approved for everyone; own pending or rejected rows for the adder; everything for `is_admin()`.
  - Insert: authenticated, with `status = 'pending'`, `added_by = auth.uid()`, and `review_note`, `merged_into` and
    `reviewed_at` all null.
  - Drinks insert also requires `can_engage_cafe(cafe_id)`.
  - Updates and deletes happen only through the admin RPCs.
- reviews:
  - Recreate the insert policy as `auth.uid() = user_id and ((product_id is not null and can_engage_product(product_id)) or (drink_id is not null and can_engage_drink(drink_id)))`.
  - Add `tea_strength`, `roast`, `instagram_url` and `disclosure` to the update column grant.
- Recreate `internal.latest_reviews` and `public.latest_reviews` with
  `distinct on (coalesce(user_id, id), coalesce(product_id, drink_id))`.
- Recreate `product_ratings`, `tea_taste_profiles`, `edition_ratings` and `product_reviews` with
  `where product_id is not null`.
- Grants follow `20261029000000_security_hardening.sql:306-310`.

- [ ] **Step 1: Write the failing DB tests.** In `test/db/cafes-and-drinks.test.ts`, use `createMigratedDb` and `as()`
      from `test/support/supabase-db.ts`. Test names:
  - `seeds singapore and johor-bahru`
  - `anyone signed in can add a pending café; anon cannot`
  - `café slug is generated, unique, and ignores client slug; update cannot change slug`
  - `drink currency follows the café city (JB → MYR)`
  - `11th pending café for one user is refused`
  - `user can rate own pending drink; others cannot rate it`
  - `review must have exactly one of product_id / drink_id`
  - `non-taster cannot set instagram_url or disclosure`
  - `taster drink review without instagram_url is refused; with valid url succeeds and by_trusted_taster = true`
  - `client cannot spoof by_trusted_taster`
  - `user cannot set own is_trusted_taster`
  - `set_trusted_taster requires admin and forces is_public`
  - `taster cannot set is_public = false`
  - `revoking taster keeps existing reviews' by_trusted_taster`
  - `drink_ratings counts latest review per person (re-log moves count by 0)`
  - `drink_ratings splits taster vs community and counts disclosed`
  - `drink_ratings excludes pending drinks and drinks at pending cafés`
  - `private-profile community review counted in community_count, hidden from drink_reviews author`
  - `merge_drink repoints reviews and sets merged_into`
  - `merge_cafe moves drinks and merges slug clashes`
  - `review_cafe approve notifies adder with kind cafe_reviewed`
  - `like on a drink review notifies author with drink_id`
  - `product_ratings unaffected by drink reviews`
  - `audit_log records café insert`
- [ ] **Step 2:** Run `pnpm vitest run test/db/cafes-and-drinks.test.ts`. Expected: FAIL (tables missing).
- [ ] **Step 3:** Write the migration to the contract above. Update the migrations README.
- [ ] **Step 4:** Run `pnpm vitest run test/db`. Expected: all DB tests pass, existing ones included.
- [ ] **Step 5:** Update `database.types.ts`. Run `pnpm schema:check` (if it needs a live DB, say so in the report)
      and `pnpm check`. Expected: clean.
- [ ] **Step 6:** Copy the spec and plan in, add the old-spec pointer, and update the CHANGELOG and READMEs. Commit
      `feat(db): cafés, drinks, drink reviews and trusted tasters schema`, then open the PR. The PR body says the owner
      must apply the migration before S2, S3 or S5 merge.

---

## S8: Cleanup sweep

**Files:**

- Modify: `src/lib/constants/env.ts` (+ README) to add `export const MARKETPLACE_ENABLED = false`, with a comment
  explaining that commerce is parked (§9.4).
- Modify: `src/app/(public)/sell/page.tsx`: call `notFound()` when `!MARKETPLACE_ENABLED`.
- Modify: `src/app/(public)/products/[id]/page.tsx`:
  - Render `WhereToBuy` only when `MARKETPLACE_ENABLED` is on and there are offers.
  - Render `StockPanel` only when a report exists or the viewer is signed in.
  - Replace the per-card "Not yet rated" badge with one quiet line.
  - Remove the "Sell it on Matchoji" link.
- Modify: `src/app/sitemap.ts`: drop `SELL` when the flag is off.
- Modify: `src/app/offline/page.tsx`: change the copy from tea-only to "cafés and teas".
- Modify: the Explore grade filter (`src/features/products/components/explore-*.tsx`): group matcha grades apart
  from hojicha grades.
- Modify: `PRODUCT.md`: rewrite Purpose, Positioning, Users, Evidence on Hand and Principles for the new positioning
  (spec §1, §2 and §4). Remove "Phase 1 only / no marketplace". Keep the no-fabrication rule.
- Do **not** touch navbar, footer, tab bar, home or `routes.ts` (S7 owns them).

- [ ] **Step 1: Failing tests.**
  - `sell page returns notFound when marketplace disabled` (`src/app/(public)/sell/page.test.tsx`).
  - Product page: `hides Where to buy when marketplace disabled` and `hides stock panel for anon with no report`.
  - `sitemap omits /sell`.
  - Explore: `grade filter groups matcha and hojicha grades`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `pnpm check && pnpm test`. Expected: green.
- [ ] **Step 5:** Commit `refactor: hide parked marketplace surfaces and tidy empty states`, update the
      CHANGELOG/READMEs, open the PR.

---

## S2: Make review consumers drink-safe

**Files:**

- Modify: `src/features/reviews/types.ts`:
  - Add `export type Disclosure = 'none' | 'invited' | 'gifted' | 'paid'`.
  - Make `Review.productId: string | null`.
  - Add `drinkId: string | null`, `byTrustedTaster: boolean`, `instagramUrl: string | null`,
    `disclosure: Disclosure`, `teaStrength: number | null` and `roast: number | null`.
- Modify: `src/features/reviews/api/reviews-service.ts`: add the new columns to `REVIEW_COLUMNS` and `mapReviewRow`.
- Create:
  - `src/features/reviews/components/disclosure-badge.tsx`: `DisclosureBadge({ disclosure }: { disclosure: Disclosure })`.
    Renders null for `none`.
  - `src/features/reviews/components/instagram-post-link.tsx`: `InstagramPostLink({ url }: { url: string })`. An
    external link labelled "See the post on Instagram", with `rel="noopener noreferrer"`.
  - Tests for both.
- Modify: `review-item.tsx`: render the badge, the link, and a "Trusted taster" chip when `byTrustedTaster` is true.
- Modify: `src/features/reviews/index.ts`: export `Disclosure`, `DisclosureBadge`, `InstagramPostLink`, `ReviewItem`
  and `mapReviewRow`/`REVIEW_COLUMNS` (they're already used by social).
- Modify the consumers listed in the code map:
  - `journal-service.ts` and `journal-timeline`: show drink reviews with café and drink names, linking to the drink
    page path `/cafes/<cafeSlug>/<drinkSlug>`. Build the path with a local helper until S3's `drinkHref` exists:
    `src/features/reviews/lib/drink-href.ts`, `drinkHref(cafeSlug: string, drinkSlug: string): string`.
  - `journal-stats` and `year-in-tea`: tea only, so filter `productId !== null`.
  - `social-service.ts`, `tasting-feed`: the feed shows both kinds.
  - `notifications-service.ts`: `describeNotification` and `notificationHref` handle `drink_id`, `cafe_reviewed` and
    `drink_reviewed`. The service resolves drink and café slugs by join.
  - `taste-service.ts`: tea only.
  - `product-ratings.ts`: ignore rows with a null `product_id`.
  - `account-service.ts` `exportMyData`: add `cafes` and `drinks` added by the user. Reviews are already exported
    with `select *`.
  - `admin-service.ts` `listOpenReports`: handle reviews with a `drink_id`. **S5 owns the rest of the admin
    feature**, so touch only this function here.

- [ ] **Step 1: Failing tests** (co-located, using `createFakeSupabase`):
  - `mapReviewRow maps drink review fields`
  - `journal lists drink and tea tastings together`
  - `year-in-tea ignores drink reviews`
  - `feed renders a drink review with café name`
  - `notificationHref for drink like → drink page`
  - `describeNotification drink_reviewed`
  - `taste match ignores drink reviews`
  - `export includes cafés and drinks added by me`
  - `reports queue shows drink review target`
  - `ReviewItem shows Gifted badge and IG link for taster review; nothing for none`
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `pnpm check && pnpm test`. Expected: green.
- [ ] **Step 5:** Commit `feat(reviews): drink-safe review consumers and disclosure UI`, update the CHANGELOG/READMEs,
      open the PR.

---

## S5: Admin tools

**Files:**

- Modify: `src/features/admin/api/admin-service.ts`. Add:
  - `listCafeQueue(supabase): Promise<AdminCafe[]>` and `listDrinkQueue(supabase): Promise<AdminDrink[]>`, returning
    pending rows with their adder.
  - `reviewCafe(supabase, id: string, decision: 'approved' | 'rejected', note?: string)` and `reviewDrink(...)`, via
    RPC.
  - `mergeCafe(supabase, duplicate: string, keep: string)` and `mergeDrink(...)`.
  - `searchProfiles(supabase, q: string): Promise<AdminProfile[]>`.
  - `setTrustedTaster(supabase, person: string, value: boolean)`.
  - `listTrustedTasters(supabase)`.
  - All use the `MISSING_TABLE` fallback.
- Modify: `src/features/admin/types.ts` (`AdminCafe`, `AdminDrink`, `AdminProfile`).
- Create:
  - `src/features/admin/components/cafe-queue.tsx` and `drink-queue.tsx`: approve, reject with note, and merge into
    an approved duplicate.
  - `src/features/admin/components/tasters-form.tsx`: search a profile, then grant or revoke.
- Modify: `admin-tabs.tsx`: `TABS = ['queue','cafes','drinks','tasters','reports','photo','price','shops']`.
- Modify: `src/app/(public)/admin/page.tsx`: wire the new tabs.

- [ ] **Step 1: Failing tests.**
  - Service: `reviewCafe calls review_cafe rpc`, `reviewCafe surfaces 42501`, `setTrustedTaster calls rpc`,
    `listCafeQueue returns [] on missing table`.
  - Components: `cafe queue approve button calls reviewCafe`, `tasters form grants badge`.
  - Page test: non-admin is redirected or 404s, as the existing admin test does.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `pnpm check && pnpm test`. Expected: green.
- [ ] **Step 5:** Commit `feat(admin): café, drink and taster moderation`, update the CHANGELOG/READMEs, open the PR.

---

## S3: Cafés feature (read side)

**Files:**

- Create `src/features/cafes/`, with:
  - `README.md`, `index.ts`, `types.ts`
  - `api/cafes-service.ts`
  - `lib/city.ts`, `lib/hrefs.ts`
  - `components/` (`cafe-card`, `cafe-list`, `cafe-map`, `drink-row`, `score-pair`, `taster-reviews`,
    `community-drink-reviews`, `city-switch`)
  - Tests.
- Create:
  - `src/app/(public)/cafes/page.tsx`
  - `src/app/(public)/cafes/[slug]/page.tsx`, with `opengraph-image.tsx` and `loading.tsx`
  - `src/app/(public)/cafes/[slug]/[drink]/page.tsx`, with `opengraph-image.tsx`
  - `src/app/c/[slug]/route.ts`: a 308 to `/cafes/<slug>`, with a test
- Modify:
  - `src/lib/constants/routes.ts`: add `CAFES: '/cafes'`, `TASTERS: '/tasters'` and
    `HOW_WE_RATE: '/about/how-we-rate'`. All new route constants land here.
  - `src/app/sitemap.ts`: add approved cafés and drinks.
  - `src/features/share/lib/{json-ld,metadata,render}.ts(x)`: add `cafeJsonLd` (schema.org `CafeOrCoffeeShop`, with
    an `aggregateRating` from the taster score only when it exists), `cafeMetadata`, `drinkMetadata`,
    `renderCafeImage` and `renderDrinkImage`.
  - Replace S2's `drinkHref` helper in reviews with a re-export from cafes, or leave it in place. The builder picks
    one; whichever it is, keep a single implementation.

**Interfaces it produces:**

```ts
// types.ts
type CitySlug = 'singapore' | 'johor-bahru'
interface City { slug: CitySlug; name: string; currency: 'SGD' | 'MYR' }
type DrinkBase = 'hojicha' | 'matcha'
type DrinkStyle = 'latte' | 'straight' | 'iced_latte' | 'float' | 'other'
type DrinkServing = 'hot' | 'iced' | 'both'
interface Cafe { id; slug; name; citySlug: CitySlug; area: string | null; address: string | null; lat: number | null;
  lng: number | null; instagramHandle: string | null; websiteUrl: string | null; status: 'pending'|'approved'|'rejected' }
interface Drink { id; cafeId; slug; name; base: DrinkBase; style: DrinkStyle; serving: DrinkServing; price: number | null;
  currency: 'SGD'|'MYR'; photoUrl: string | null; photoCredit: string | null; teaProductId: string | null; status }
interface ScorePair { tasterAvg: number | null; tasterCount: number; tasterDisclosedCount: number;
  communityAvg: number | null; communityCount: number }
interface DrinkWithScores extends Drink { scores: ScorePair; cafe: Pick<Cafe,'slug'|'name'|'area'|'citySlug'> }
interface CafeSummary extends Cafe { scores: ScorePair; drinkCount: number }

// api/cafes-service.ts  (all take supabase: SupabaseClient<Database> first)
listCities(): Promise<City[]>
listCafes(supabase, opts: { city: CitySlug; area?: string; tasterOnly?: boolean }): Promise<CafeSummary[]>
getCafePage(supabase, slug: string): Promise<{ kind: 'found'; cafe: Cafe; drinks: DrinkWithScores[] } | { kind: 'redirect'; to: string } | { kind: 'missing' }>
getDrinkPage(supabase, cafeSlug: string, drinkSlug: string): Promise<{ kind: 'found'; drink: DrinkWithScores; tasterReviews: Review[]; communityReviews: Review[]; teaProduct: { id: string; name: string } | null } | { kind: 'redirect'; to: string } | { kind: 'missing' }>
listTopDrinks(supabase, opts: { city: CitySlug; base?: DrinkBase; style?: DrinkStyle; limit?: number }): Promise<DrinkWithScores[]>  // threshold from Global constraints; rank taster_avg desc nulls last, then community_avg
listSimilarDrinks(supabase, drink: Drink, citySlug: CitySlug, limit = 6): Promise<DrinkWithScores[]>
listLatestTasterDrinkReviews(supabase, opts: { city: CitySlug; limit?: number }): Promise<Array<{ review: Review; drink: DrinkWithScores }>>

// lib/city.ts
CITY_COOKIE = 'matchoji-city'
resolveCity(searchParam: string | undefined, cookieValue: string | undefined): CitySlug  // query > cookie > 'singapore'
// lib/hrefs.ts
cafeHref(slug: string): string; drinkHref(cafeSlug: string, drinkSlug: string): string; shortCafeHref(slug: string): string  // '/c/<slug>'
// components
ScorePair({ scores }: { scores: ScorePair })  // taster block first; "n of m taster reviews were gifted/paid" when disclosed > 0; hides empty side
CitySwitch({ current }: { current: CitySlug })  // sets ?city= and the cookie
```

Redirect rules for `getCafePage` and `getDrinkPage`:

- A row with `merged_into` redirects to the survivor's page.
- A rejected drink redirects to its café.
- A rejected or unknown café is `missing`.
- Pages call `permanentRedirect` for a redirect and `notFound()` for missing.

Pages follow spec §6.2:

- The café page lists drinks with `ScorePair`, the IG handle link and the map pin (`TeaMap`).
- The drink page puts the taster block first (with `ReviewItem` from reviews), then the community block, "Tea used
  here" and "Similar drinks".
- The "Rate this drink" button is a placeholder slot that S4 fills. Render nothing yet.

- [ ] **Step 1: Failing tests.**
  - Service:
    - `listCafes filters by city and area`
    - `listCafes returns [] on 42P01`
    - `getCafePage redirects merged café`
    - `getDrinkPage redirects rejected drink to café`
    - `getDrinkPage splits taster and community reviews`
    - `listTopDrinks applies threshold (1 taster or 3 community)`
    - `listTopDrinks ranks taster score above community`
  - `resolveCity prefers query over cookie, defaults singapore`.
  - `ScorePair shows disclosed line only when > 0`.
  - `/c/[slug] route 308s to /cafes/[slug]`.
  - Page tests: `café page notFound for unknown slug`, `drink page renders taster block before community`.
  - `sitemap includes approved cafés`.
  - `cafeJsonLd omits aggregateRating without taster score`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. Run an `impeccable polish` pass on the new pages, using the existing design system.
- [ ] **Step 4:** `pnpm check && pnpm test && pnpm build`. Expected: green.
- [ ] **Step 5:** Commit `feat(cafes): café and drink pages`, update the CHANGELOG/READMEs, open the PR.

---

## S4: Rating flow

**Files:**

- Create in `src/features/cafes/`:
  - `schemas/cafe.schema.ts`: `cafeSchema` (name, citySlug, area, address, instagramHandle, websiteUrl),
    `CafeInput = z.input`, `CafeOutput = z.infer`.
  - `schemas/drink.schema.ts`: `drinkSchema` (cafeId, name, base, style, serving, price).
  - `schemas/drink-review.schema.ts`:
    - `drinkReviewSchemaFor(opts: { isTaster: boolean; base: DrinkBase })`.
    - Fields: stars (required), notes, photoUrl, flavorNotes, sweetness, body, bitterness, teaStrength, roast
      (only when base is hojicha), tastedOn.
    - Taster-only fields: `instagramUrl` (required, IG regex) and `disclosure` (required, with no default selected).
  - `api/cafes-mutations.ts`:
    - `createCafe(supabase, input: CafeOutput): Promise<Cafe>`
    - `createDrink(supabase, input: DrinkOutput): Promise<Drink>`
    - `createDrinkReview(supabase, drinkId: string, input: DrinkReviewOutput): Promise<void>`
    - Map the DB "pending cap" error to the message "You have too many cafés waiting for review. Try again once
      they're approved."
  - `hooks/`: `use-cafe-search.query.ts`, `use-drink-search.query.ts`, `use-create-cafe.mutation.ts`,
    `use-create-drink.mutation.ts`, `use-log-drink-review.mutation.ts`.
  - `components/drink-log-flow.tsx`: `DrinkLogFlow({ initialDrink?: DrinkWithScores; onDone: () => void })`. It runs
    café search or add, then drink search or add, then the review form. It reads `isTrustedTaster` from the
    profile.
  - `components/rate-this-drink.tsx`.
- Create: `src/components/widgets/log-dialog/` (`log-dialog.tsx`, `index.ts`, README, test):
  - `LogDialog({ trigger, initial?: { kind: 'tea'; prep?: ReviewPrep } | { kind: 'drink'; drink: DrinkWithScores } })`.
  - The first step asks "A café drink" or "A tea I brewed". It's skipped when `initial` is set.
  - The tea path renders the existing `LogTastingFlow` from reviews; the drink path renders `DrinkLogFlow`.
- Modify:
  - Every `LogTastingDialog` usage in `src/app` to use `LogDialog`. `LogTastingDialog` stays exported for the tea
    path.
  - The drink page: fill the "Rate this drink" slot with `RateThisDrink`.

- [ ] **Step 1: Failing tests.**
  - Schema: `taster schema requires instagramUrl and disclosure`, `community schema has no instagramUrl`,
    `roast only for hojicha`, `rejects non-instagram url`.
  - Mutations: `createDrinkReview inserts drink_id not product_id`, `maps pending-cap error to friendly message`.
  - Widget: `LogDialog chooser routes to drink flow`, `initial drink skips chooser`.
  - `DrinkLogFlow lets user add a new café then a drink then rate`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `pnpm check && pnpm test && pnpm build`. Expected: green.
- [ ] **Step 5:** Commit `feat(cafes): rate café drinks`, update the CHANGELOG/READMEs, open the PR.

---

## S6: Taster profiles

**Files:**

- Modify: `src/features/account/api/account-service.ts`: add
  `updateProfileDetails(supabase, input: { instagramHandle: string | null; bio: string | null })`, Zod-validated with
  `profileDetailsSchema` in `src/features/account/schemas/profile-details.schema.ts`.
- Modify: `account-sections.tsx`: add the IG handle and bio fields, with a test.
- Modify: `src/features/social/api/social-service.ts` `getProfileView`: return `isTrustedTaster`, `instagramHandle`,
  `bio`, and drink reviews.
- Modify: `src/app/(public)/u/[id]/page.tsx` and its OG image: add the badge, bio and IG handle link.
- Create: `src/features/social/components/trusted-taster-badge.tsx` (`TrustedTasterBadge()`).
- Create: `src/app/(public)/tasters/page.tsx`, using `listTrustedTasters` from a new social service function
  `listTasters(supabase): Promise<TasterCard[]>` (avatar, name, bio, handle, review count, latest drink review).
- Create: `src/app/(public)/about/how-we-rate/page.tsx`: static copy explaining the taster vs community scores, the
  disclosure labels, "disclosed reviews count and are labelled", and one rating per person. Plain words.
- Modify: `src/app/sitemap.ts`: add `/tasters` and `/about/how-we-rate`.

- [ ] **Step 1: Failing tests.**
  - `updateProfileDetails rejects handle with @ or spaces`
  - `bio over 280 rejected`
  - `profile page shows badge and IG link for taster`
  - `listTasters returns only trusted tasters`
  - `tasters page empty state hides when none`. With no tasters, the page shows one line, not an empty grid.
  - `how-we-rate page renders disclosure labels`
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `pnpm check && pnpm test`. Expected: green.
- [ ] **Step 5:** Commit `feat(social): trusted taster profiles and how we rate`, update the CHANGELOG/READMEs, open
      the PR.

---

## S7: Home, navigation and top lists

**Files:**

- Modify: `src/app/(public)/page.tsx` (Home), per spec §6.2:
  - Copy: the H1 is "The trusted guide to hojicha and matcha drinks in Singapore and JB". The subhead is "Rated drink
    by drink, by tasters you can follow." These are the orchestrator's copy calls; the builder may polish them.
  - Sections: `CitySwitch`, "Latest from our tasters" (`listLatestTasterDrinkReviews`), "Top hojicha lattes in
    <city>" (`listTopDrinks`), cafés by area, and one "Brew it at home" link row.
  - Remove the old tea rails and the repeated links.
  - Each section hides when empty.
- Modify: `src/components/layout/navbar.tsx`:
  - Links: Cafés, Top, Tasters, and an "At home" menu (Teas = `/explore`, Learn, Regions).
  - The log control becomes a labelled "Log a drink" button that opens `LogDialog`.
  - Fix the "Search teas" mislabel.
- Modify: `mobile-tab-bar.tsx`: tabs are Home, Cafés, Log, Top, Journal.
- Modify: `site-footer.tsx`:
  - Links: Regions, Tea supply, Learn, Tea shops, How we rate.
  - Remove Sell.
  - Replace "A hobby project" with the "How we rate" link.
- Modify: `src/app/(public)/top/page.tsx` and `top/[slug]/page.tsx`:
  - Drink lists per city × (base, style), with slugs like `singapore-hojicha-latte`, through `listTopDrinks`.
  - The existing tea lists move to `/top/teas` and `/top/teas/[slug]`, as a section on the index labelled "At home".
  - Old `/top/<tea-list-slug>` URLs 308 to `/top/teas/<slug>`.
- Modify: `src/features/shops`: change the "Shops" labels to "Tea shops".
- Modify: `src/app/sitemap.ts`: add the new top list URLs.

- [ ] **Step 1: Failing tests.**
  - Home: `renders new H1`, `hides taster rail when empty`, `?city=johor-bahru switches lists`.
  - Navbar: `has Cafés, Top, Tasters, At home`, `log button labelled Log a drink`.
  - Footer: `has no Sell link and no hobby copy`.
  - Tab bar: `has five tabs in order`.
  - `/top`: `lists drink tops per city`, `old tea list slug redirects to /top/teas/<slug>`.
  - Update `test/app/pages.test.tsx` and `seo.test.ts` expectations.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. Run an `impeccable polish` pass on home and nav.
- [ ] **Step 4:** `pnpm check && pnpm test && pnpm build`, plus `e2e` smoke if it runs locally. Expected: green.
- [ ] **Step 5:** Commit `feat: café-first home, navigation and top lists`, update the CHANGELOG/READMEs, open the PR.

---

## S9: Protected docs (owner approval required)

- Change AGENTS.md "Project-Specific Notes": "Phase 1 only" becomes the current state: the café-drink positioning,
  marketplace parked behind `MARKETPLACE_ENABLED`, and label scanning and Sentry inert.
- Change CONSTITUTION §2's phase rule: keep "no marketplace checkout or farm tools without the owner's go-ahead",
  and add "products never reference cafés or drinks".
- The PR carries a `## Protected File Changes` section. Open it only after the owner approves the wording in chat.

## Self-review notes

- Spec coverage:
  - §6.1 → S1; §6.2 → S3, S6, S7; §6.3 → S7; §6.4 → S1 (views), S3 (`ScorePair`), S6 (how-we-rate); §6.5 → S4;
    §6.6 → S5; §6.7 → S8, S7, S9; §6.8 → owner data, entered through S5's admin or S4's flow after launch; §7.1 → S2;
    §7.5 → S1, S3, S4; §9 → Global constraints.
- Seed data (§6.8) has no task. The owner supplies cafés and posts after S5 lands, and adds them through the UI.
- Type names are consistent across slices: `CitySlug`, `ScorePair`, `DrinkWithScores`, `Disclosure`, `drinkHref`,
  `LogDialog`.
