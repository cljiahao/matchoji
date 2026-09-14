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

## Connectivity

`app/` is the Next.js App Router entry point (pages, layouts, API routes); it renders UI from `components/` and `features/`. `features/` modules call out to `integrations/` for external services and lean on shared helpers in `lib/`. `hooks/` is a placeholder for cross-feature hooks that don't belong to one `features/<name>/` module.

## Parent

[matchoji](../README.md)
