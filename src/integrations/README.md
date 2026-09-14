# integrations

## Purpose

External-service client infrastructure — base HTTP client classes, shared error type, the
factory pattern for constructing concrete clients, and the Supabase client wiring.

## Contents

- `clients/`
- `error.ts`
- `factories.ts`
- `supabase/`

## Connectivity

`clients/` holds transport-level base classes for generic REST clients; `factories.ts`
documents the pattern for wiring one on top of them; `error.ts` defines the `APIError` type
both depend on. `supabase/` is separate — Supabase is accessed directly via its own SDK, not
through the generic `clients/` pattern.

## Parent

[src](../README.md)
