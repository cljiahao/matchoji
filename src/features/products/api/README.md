# api

## Purpose

Supabase reads (server-safe, take a client instance) and the one client-side mutation for
creating a product. `listProducts` takes the Discover filters (search, category, region, sort) and adds each
rated product's two most-noticed flavour notes (`topNotesByProduct`); grade and rating are
filtered after it, in `lib`. `listRegionSummaries` returns every region with its tea counts and supply levels; each
product carries `supply`, its category's level in its region. Region, rating and note
lookups go through `selectIn` batches, since `listProducts` loads the whole catalogue. Pure helpers
(rating merge/sort, search-filter building) are split out
so they can be unit-tested without a client. Services are tested against a recording
fake Supabase client (`test/support/fake-supabase.ts`).

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
