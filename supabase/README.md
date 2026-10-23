# supabase

## Purpose

Supabase Postgres schema, RLS policies, and Storage bucket setup as versioned SQL migrations. No Supabase CLI configured yet (`supabase init` not run) — these files are the schema spec, applied manually via the Supabase SQL editor or the CLI once a project is linked.

## Contents

- `migrations/`
- `seed/`

## Connectivity

`test/db/` applies these migrations (storage excepted) to an in-process Postgres (PGlite) with a
stub of Supabase's auth schema and roles, and checks the audit-log triggers and RLS.

`migrations/` holds the numbered SQL files, one per concern (Phase 1 tables, Phase 1 storage, public reviewer names + region seed, tasting journal, audit log), applied in filename order. `seed/` holds data scripts (real teas for the catalogue) run by
hand after the migrations.

## Parent

[matchoji](../README.md)
