# api

## Purpose

Supabase reads (server-safe, take a client instance) and the one client-side mutation for
creating a product. `listProducts` reads the first `shown` (12 by default) of `catalogue_teas` (approved teas with region, rating,
weighted score and scarcity rank), applying search, tea, region, grade and minimum rating as
SQL filters and each sort as an ORDER BY ("Top rated" by weighted score with a 3-rating
floor); it returns those teas and the total, plus each rated tea's two most-noticed notes.
`listGradeOptions` lists the grades among the other matches. `searchProducts` calls the
`search_teas` database function, which ranks typo-tolerant matches. `listRegionSummaries` returns every region with its tea counts and supply levels; each
product carries `supply`, its category's level in its region, and `shopUrl`. Explore, the shelves and the region counts read approved teas only;
`searchProducts` (the "Log a tasting" picker) returns approved teas plus the searcher's own
teas awaiting review. Every product carries its reference `price` (from `catalogue_teas` for lists; for a tea's page,
the pack price on `products` and its band from `tea_prices`, read only for an approved priced
tea). Card flavour notes come from `tea_taste_profiles` (which counts private tasters too), and a failed region or
rating lookup throws rather than showing a tea as unrated. `getProduct` also reads
`review_note` and `merged_into`. Region, rating and note
lookups go through `selectIn` batches, since `listProducts` loads the whole catalogue. Pure helpers
(rating merge/sort, search-filter building) are split out
so they can be unit-tested without a client. Services are tested against a recording
fake Supabase client (`test/support/fake-supabase.ts`).

`getProduct` reads `products.image_credit` into `imageCredit`; list rows leave it null.

## Contents

- `index.ts`
- `product-ratings.test.ts`
- `product-ratings.ts`
- `products-mutations.test.ts`
- `products-mutations.ts`
- `products-service.test.ts`
- `products-service.ts`
- `search-filter.test.ts`
- `search-filter.ts`

## Parent

[products](../README.md)
