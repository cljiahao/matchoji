# src

## Purpose

All application code: routes, UI, feature modules, and shared utilities.

## Contents

- `app/`
- `components/`
- `features/`
- `hooks/`
- `integrations/`
- `lib/`
- `proxy.ts`

## Connectivity

`app/` is the Next.js App Router entry point (pages, layouts, API routes); it renders UI from `components/` and `features/`. `features/` modules call out to `integrations/` for external services and lean on shared helpers in `lib/`. `hooks/` is a placeholder for cross-feature hooks that don't belong to one `features/<name>/` module.

`proxy.ts` is Next 16's proxy (the old middleware): it refreshes the Supabase session and sets the per-request, nonce-based Content-Security-Policy on every route except `/api/health` and static files. It lives here, not at the repo root, because Next only loads it from `src/` when that folder exists.

## Parent

[matchoji](../README.md)
