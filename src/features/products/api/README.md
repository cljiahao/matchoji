# api

## Purpose

Supabase reads (server-safe, take a client instance) and the one client-side mutation for
creating a product. Pure helpers (rating merge/sort, search-filter building) are split out
so they can be unit-tested without a client.

## Contents

- `index.ts`
- `products-mutations.ts`
- `product-ratings.ts`
- `product-ratings.test.ts`
- `products-service.ts`
- `search-filter.ts`
- `search-filter.test.ts`

## Parent

[products](../README.md)
