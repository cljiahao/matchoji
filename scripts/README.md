# scripts

## Purpose

Standalone Node scripts invoked from `package.json` that don't belong inside `src/`.

`schema-check.ts` (`pnpm schema:check`) checks the live Supabase database against `supabase/migrations/` and `database.types.ts` using the read-only `SUPABASE_DB_URL`; it skips with exit 0 when that is unset. See `docs/schema-checks.md`.

## Contents

- `check-route-logging.mjs`
- `schema-check.ts`

## Parent

[matchoji](../README.md)
