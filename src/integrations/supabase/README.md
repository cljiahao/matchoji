# supabase

## Purpose

Supabase client wiring: browser client, server (RSC/route handler) client, session-refresh
middleware and hand-written database types. All three clients read their settings through
`env.ts`'s `supabaseEnv()`, which throws a clear "Supabase is not configured" error when the
URL or key is missing; there is no offline fallback, so local dev needs `.env.local`. Clients authenticate with the publishable key
(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `sb_publishable_...`), Supabase's replacement for
the legacy anon key; no secret key is used. `clients.test.ts` checks the cookie
wiring with `@supabase/ssr` mocked.

`select-in.ts` splits a long `.in()` id list into batches of 100 (PostgREST puts the list in
the URL) and merges the rows; every service with an open-ended id list uses it.

`database.types.ts` covers the tasting-journal columns, `wishlist` and the regions'
`matcha_supply` / `hojicha_supply` levels (`SupplyLevel`), `tea_production_stats`, `stock_reports` (`StockStatus`),
`products.shop_url`, `products.status` (`ProductStatus`) and `added_by`, the `latest_reviews`
view, `profiles.is_admin`, `review_note` and `merged_into`, the admin functions,
`search_teas` and `delete_my_account` under `Functions`, a nullable `reviews.user_id` (for
deleted accounts), `profiles.is_public`, `follows`, `blocks` and `following_feed`, `review_likes`, `review_comments`,
`notifications` (`NotificationKind`), `content_reports` (`ReportTarget`) and `resolve_report`, review editions (`Flush`), the
`edition_ratings` view and the want-to-try stash columns, `health`, `product_reviews` (with
`author_private`) and `is_public_profile`, product prices (`price_sgd`, `pack_grams`, `PriceBand`),
the `tea_prices` view and `set_tea_price`, `lesson_progress`, the `catalogue_teas` and `tea_taste_profiles` views, and `vendors` (`VendorStatus`) and `listings`; `orders` is not modeled
until checkout is built. `pnpm db:types` writes the CLI's generated types to
`database.generated.ts` for comparing against these hand-written ones.

## Contents

- `client.ts`
- `clients.test.ts`
- `database.types.ts`
- `env.test.ts`
- `env.ts`
- `middleware.ts`
- `select-in.test.ts`
- `select-in.ts`
- `server.ts`

## Parent

[integrations](../README.md)
