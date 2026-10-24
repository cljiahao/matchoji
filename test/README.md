# test

## Purpose

Vitest test suite for `src/`. Unit and component tests for features live next to their
source as `*.test.ts(x)`; this folder holds route-level tests and shared test support.

## Contents

- `api/`
- `app/`
- `db/`
- `scripts/`
- `support/`

## Connectivity

`api/` mirrors `src/app/api/`'s route structure one-to-one — each route handler gets a matching test file here. `app/` tests the page routes and the OAuth callback. `db/` runs `supabase/migrations/` in PGlite and tests database behaviour (the audit log). `scripts/` tests the Node scripts in `scripts/`. `support/` is loaded by `vitest.config.ts` (`setup.ts`) and imported by tests for fakes and render helpers.

## Parent

[matchoji](../README.md)
