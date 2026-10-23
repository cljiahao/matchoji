# Matchoji — Hojicha & Matcha Discovery/Marketplace Platform

Status: Draft for review
Date: 2026-09-14

## 1. Background & Research Summary

Existing "Vivino for X" apps cover wine, coffee, sake, beer, and matcha (Matcha
Journal, BevMe, Matcha Map, Crumble). No dedicated hojicha rating/discovery app
exists. Hojicha is not a distinct farm/region category — it's a roasting
process applied to lower-grade leaf (bancha/sencha/kukicha), made everywhere
tea grows, and is currently trending as an affordable, plentiful counterpart
to matcha during the ongoing matcha shortage. That contrast (matcha scarce,
hojicha abundant, same region) is a stronger hook than either category alone.

Separately, no unified platform combines named-farm/region location, visit
information, and production/scarcity data. Farm-level yield data is not
publicly disclosed anywhere (commercially sensitive); the finest public
granularity is municipal-level tea cultivation area via Japan's e-Stat
作物統計調査 (e-stat.go.jp/dbview?sid=0003268421). Retailer-stock-as-scarcity-proxy
is already exploited by restock-alert bots (Matcha Alert Club, MatchaAlerts.com,
MatchaNotify, TokiTea, MatchaRestock) scraping Ippodo/Marukyu Koyamaen/Sazentea
— proving the technique works at hobby scale, but plain restock-alerting alone
is saturated and not a differentiator on its own.

## 2. Goal

A platform that is, at maturity, four things:

1. **Rating/discovery** — Vivino-style product ratings and reviews for
   hojicha and matcha.
2. **Search/discovery** — browse and filter products by region, grade,
   rating, scarcity.
3. **Marketplace** — consumers buy directly from farms/roasters through the
   platform.
4. **Farm-facing tools** — farms/roasters get demand signals, ratings
   visibility, and regional scarcity context back from the platform.

This is a solo/fun project with commercial intent but no funding — scope is
built incrementally, each phase shipping and gathering real usage before the
next is built. Phases 3-4 depend on data and users Phase 1 produces; building
them earlier means building supply-side infrastructure for a demand side that
doesn't exist yet, which is the classic reason multi-sided platforms fail
before launch.

## 3. Tech Stack

- **Next.js (App Router)**, deployed on Vercel — frontend + API routes in one
  repo, one deploy target.
- **Supabase** — Postgres (data), Auth (Google OAuth, both consumer and
  vendor accounts), Storage (review/listing photos).
- Payments (Phase 3+): Stripe Connect (multi-vendor payout) — deferred
  entirely until Phase 3, not stubbed, since it's the most legally and
  technically complex piece and premature to design against.

## 4. Data Model (all phases, schema-first)

`Product` is kept seller-agnostic from the start — a canonical catalog item,
like a wine on Vivino, that exists independently of who sells it. Every later
subsystem attaches to `Product` by foreign key, additively, so Phase 1 tables
never require reworking.

| Entity    | Fields                                                                       | Phase built | Notes                                                                                                                          |
| --------- | ---------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `User`    | id, email, role (`consumer` \| `vendor`), created_at                         | 1           | Supabase Auth. Role added now — cheap now, expensive to retrofit.                                                              |
| `Region`  | id, name, prefecture, municipality, e_stat_area_ha, scarcity_note            | 1           | Seeded thin at first (name/prefecture only); e-Stat cultivation-area and scarcity fields filled in as Phase 4 data work lands. |
| `Product` | id, name, brand, category (`hojicha`\|`matcha`), grade, region_id, image_url | 1           | Core catalog entity.                                                                                                           |
| `Review`  | id, user_id, product_id, stars (1-5), notes, photo_url, created_at           | 1           | One user's rating of one product.                                                                                              |
| `Vendor`  | id, user_id (role=vendor), farm/roaster name, profile info                   | 3           | Schema defined now; no UI/flow until Phase 3.                                                                                  |
| `Listing` | id, vendor_id, product_id, price, stock                                      | 3           | Many-to-many: one product, many vendors. Schema now, no UI/flow until Phase 3.                                                 |
| `Order`   | id, buyer_user_id, listing_id, qty, status, payment_ref                      | 3           | Schema stub only. `payment_ref` is an opaque string until Stripe Connect is actually integrated.                               |

Search/discovery (Phase 2) is not a separate entity — it is queries over
`Product` + `Review` + `Region` (filter by region, grade, rating, scarcity_note),
so it falls out of the Phase 1 schema almost for free.

## 5. Phase Breakdown

### Phase 1 — Rating & Discovery (build now)

Consumer-facing MVP. Features:

- Google OAuth sign-in (Supabase Auth).
- Add/browse `Product` entries (name, brand, category, grade, region, photo).
- Rate + review a product (stars, notes, photo).
- Discover feed: products sorted by aggregate rating / recent activity, each
  showing avg stars + review count.
- Product detail page: all reviews + your own rate/log form.

Error handling: Supabase client errors (expired session, RLS denial) surface
as a toast; 401s redirect to login. Form validation (rating required 1-5,
name required) enforced client-side and re-checked server-side before insert.

Testing: MVP scope — manual click-through in browser before calling any slice
done (per project's `run` workflow). Add focused unit tests only around
rating-aggregation logic (avg calculation), since that's the one place a
silent bug would corrupt displayed data without being visually obvious.

Row-level security: `Review` rows are insertable only by their `user_id`
(auth.uid()), readable by everyone. `Product` rows readable by everyone,
insertable by any authenticated user for now (revisit moderation once there's
real usage).

### Phase 2 — Search/Discovery Enhancements

Once Phase 1 has real data:

- Filter discover feed by region, category, grade, rating threshold.
- Region browse view — list/group products by `Region`.
- Sort by scarcity_note where populated (surfaces the "matcha scarce here,
  hojicha abundant here" contrast once Phase 4 data exists).

No new entities. Pure query/UI work on top of Phase 1 tables.

### Phase 3 — Marketplace

Build only once Phase 1-2 show real consumer usage (there is no reason a
farm/roaster would onboard to a marketplace with zero existing users).

- Vendor onboarding flow: a `User` becomes a `Vendor` (apply, verify — manual
  review at this scale, no need for automated KYC yet).
- Vendor dashboard: create/edit `Listing`s (attach price/stock to an existing
  `Product`, or propose a new `Product`).
- Checkout flow: `Order` creation, Stripe Connect for payment + multi-vendor
  payout.
- Order status tracking for both buyer and vendor.

Open risk: cross-border sale of agricultural goods (shipping tea
internationally) may carry customs/import requirements per destination
country — needs real legal research before this phase starts, not solved
here.

### Phase 4 — Farm-Facing Tools

Build once Phase 3 has order/listing volume worth showing back to farms.

- Vendor analytics: rating trends, view/order counts for their `Listing`s.
- Regional scarcity dashboard: ingest e-Stat 作物統計調査 municipal
  cultivation-area data into `Region.e_stat_area_ha`; optionally a retailer
  stock-scrape job (same technique as Matcha Alert Club et al.) to populate
  `Region.scarcity_note` with a live scarce/abundant signal per category.
- Surfacing demand signals (what's rating well, what's selling) back to
  vendors, as the value proposition for farms to stay on the platform.

Update 2026-10-23 — the scarcity dashboard shipped ahead of Phase 3 (user's call)
at prefecture level, not municipal: e-Stat's municipal tea series ends in 2006,
and MAFF stopped breaking production down by tea type (tencha) after 2016 (per
prefecture, after 2008). It reads `tea_production_stats` (MAFF fields and raw
tea, plus the growers' federation's 2025 tencha) on `/regions/supply`;
`Region.e_stat_area_ha` stays empty and the scarce/tight levels stay editorial.
The retailer stock scrape was not built (ToS check still open).

Open risk: scraping retailer stock pages is proven viable at hobby scale by
existing restock-alert bots, but should be checked against each retailer's
ToS before automating at platform scale (different risk profile than a
personal Discord bot).

## 6. Non-Goals (for now)

- No native mobile app — web app works on mobile browser, no app-store
  review overhead.
- No payments/checkout before Phase 3.
- No automated vendor KYC/verification — manual review while volume is low.
- No moderation tooling for Product/Review spam — revisit if it becomes a
  real problem.

## 7. Open Questions

- Legal review needed before Phase 3 (cross-border agricultural sales) and
  before automating Phase 4 scraping (retailer ToS).
- e-Stat data licensing/attribution requirements for public display — check
  before Phase 4 ships the scarcity dashboard. Resolved 2026-10-23: e-Stat and
  MAFF terms allow reuse with a source credit and a note that the figures were
  processed; the supply page carries both.
