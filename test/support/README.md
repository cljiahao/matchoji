# support

## Purpose

Shared test infrastructure. `setup.ts` registers jest-dom matchers, RTL cleanup, and the
jsdom polyfills Radix needs. `supabase-db.ts` builds a PGlite Postgres with every migration applied (and `pg_trgm`), for
`test/db`, except data-only ones listed in `DATA_MIGRATIONS` (`catalogue_expansion`), which tests run themselves so the catalogue starts empty. `fake-supabase.ts` is a recording PostgREST-shaped client (database functions are
queued as `rpc:<name>`, and a result may carry `count`) (a queued result may be a Promise, so a test can
observe state while a request is in flight);
`fake-browser-client.ts` adds steerable auth and storage (upload, remove and list) on top for
component tests;
`render.tsx` wraps renders in a fresh TanStack Query client and provides `makeProduct` (unpriced by default) /
`makeReview` fixtures (`makeReview` has an `authorId` and no edition) (`makeProduct` is an approved tea with no supply level or shop link unless a test sets one).

`makeProduct` includes `imageCredit`.

`journal.ts` provides `makeEntry`, a journal entry (a `makeReview` with a tea and no region by default) whose tea fields can be overridden, for the stats, year-in-tea and year-page tests.

## Contents

- `fake-browser-client.ts`
- `fake-supabase.ts`
- `journal.ts`
- `render.tsx`
- `supabase-db.ts`
- `setup.ts`

## Parent

[test](../README.md)
