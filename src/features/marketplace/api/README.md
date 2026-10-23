# api

## Purpose

`vendor-service`: `getMyVendor` (the user's own shop at any status, with the admin's
`reviewNote`), `applyAsVendor` (inserts without a status, so it starts pending),
`updateVendor` and `reapplyAsVendor` (a rejected shop back to pending). `listing-service`:
`listVendorListings` (with each tea's summary), `saveListing` (insert or update),
`deleteListing`, `listCatalogue` (approved teas, for the tea picker) and `listProductOffers`, which joins
approved vendors in code and orders in-stock offers first, cheapest first within a currency.
Tested against the recording fake Supabase client.

## Contents

- `index.ts`
- `listing-service.ts`
- `marketplace-services.test.ts`
- `vendor-service.ts`

## Parent

[marketplace](../README.md)
