# supabase

## Purpose

Supabase client wiring: browser client, server (RSC/route handler) client, session-refresh
middleware, hand-written database types, and a dev-only mock-data fallback used until a real
Supabase project exists. `clients.test.ts` checks the cookie
wiring with `@supabase/ssr` mocked.

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
