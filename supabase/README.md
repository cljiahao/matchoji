# supabase

## Purpose

Supabase Postgres schema, RLS policies, and Storage bucket setup as versioned SQL migrations. `config.toml` configures the Supabase CLI: `pnpm db:start` runs the stack locally (Postgres 17, Studio on port 54323) and applies the migrations and seeds; the hosted project still gets its migrations through the SQL editor, or `pnpm db:push` once linked.

## Contents

- `config.toml`
- `migrations/`
- `seed/`

## Connectivity

`test/db/` applies these migrations (storage excepted) to an in-process Postgres (PGlite) with a
stub of Supabase's auth schema and roles, and checks the audit-log triggers and RLS.

`migrations/` holds the numbered SQL files, one per concern (Phase 1 tables, Phase 1 storage, public reviewer names + region seed, tasting journal, audit log), applied in filename order. `seed/` holds data scripts (real teas for the catalogue) run by
hand after the migrations.

## Parent

[matchoji](../README.md)
