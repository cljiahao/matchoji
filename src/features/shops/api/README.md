# api

## Purpose

Reads and writes `shop_locations`: `listShops`, `hasShopsForBrand` (case-insensitive, wildcard-safe), `createShop`, `updateShop`, `deleteShop`. A missing table reads as empty; writes are gated by admin-only RLS.

## Contents

- `index.ts`
- `shops-service.test.ts`
- `shops-service.ts`

## Parent

[shops](../README.md)
