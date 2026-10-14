# supabase

## Purpose

Supabase Postgres schema, RLS policies, and Storage bucket setup as versioned SQL migrations. No Supabase CLI configured yet (`supabase init` not run) — these files are the schema spec, applied manually via the Supabase SQL editor or the CLI once a project is linked.

## Contents

- `migrations/`

## Connectivity

`migrations/` holds the numbered SQL files, one per concern (Phase 1 tables, Phase 1 storage, public reviewer names + region seed), applied in filename order.

## Parent

[matchoji](../README.md)
