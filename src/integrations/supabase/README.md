# supabase

## Purpose

Supabase client wiring: browser client, server (RSC/route handler) client, session-refresh
middleware, hand-written database types, and a dev-only mock-data fallback used until a real
Supabase project exists. Clients authenticate with the publishable key
(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `sb_publishable_...`), Supabase's replacement for
the legacy anon key; no secret key is used. `clients.test.ts` checks the cookie
wiring with `@supabase/ssr` mocked.

`database.types.ts` covers the tasting-journal columns and `wishlist`; mock reviews carry
sample notes, profiles and prep so the product page can be checked without data.

## Contents

- `client.ts`
- `clients.test.ts`
- `database.types.ts`
- `is-configured.test.ts`
- `is-configured.ts`
- `middleware.ts`
- `mock-data.test.ts`
- `mock-data.ts`
- `server.ts`

## Parent

[integrations](../README.md)
