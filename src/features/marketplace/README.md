# marketplace

## Purpose

Phase 3, first slice: vendors (farms, roasters, tea shops) apply to sell, are approved by hand,
and list catalogue teas with a price, currency, stock and a buy link to their own site. Each
tea's page shows approved vendors' listings under "Where to buy". Shops are approved or rejected (with a reason)
in the `/admin` review queue, and a rejected shop can apply again. Checkout through Stripe
Connect and order tracking come in later slices; until then buying happens on the vendor's
site.

## Contents

- `api/`
- `components/`
- `index.ts`
- `lib/`
- `schemas/`
- `types.ts`

## Connectivity

Depends on `products` (its `ProductSummary` type and catalogue rows) through its `index.ts`.
The database enforces the rules: users apply for themselves only, cannot change a shop's
status, and only approved vendors can list; see
`supabase/migrations/20261024100000_marketplace_vendors_listings.sql`.

## Parent

[features](../README.md)
