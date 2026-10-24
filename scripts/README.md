# scripts

## Purpose

Standalone Node scripts invoked from `package.json` that don't belong inside `src/`.
`check-migration-drift.mjs` (`pnpm db:drift`, and the Migration drift workflow) lists
migrations the hosted project has not recorded in `supabase_migrations.schema_migrations`,
read through the Supabase Management API with `SUPABASE_ACCESS_TOKEN` and
`SUPABASE_PROJECT_REF`; it exits 1 when any are missing.

## Contents

- `check-migration-drift.mjs`
- `check-route-logging.mjs`

## Parent

[matchoji](../README.md)
