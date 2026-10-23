# schemas

## Purpose

Zod schemas for the two forms. `vendorSchema` uppercases country codes, turns "SG, MY, JP"
into an array and accepts only https websites. `listingSchema` coerces the typed price and
stock, requires a positive price and whole units, uppercases the currency and requires an
https buy link. The database repeats these checks.

## Contents

- `index.ts`
- `marketplace.schema.test.ts`
- `marketplace.schema.ts`

## Parent

[marketplace](../README.md)
