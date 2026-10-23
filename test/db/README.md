# db

## Purpose

Database tests: `audit-log.test.ts` applies `supabase/migrations/` (storage excepted) to an
in-process PGlite Postgres, with a stub of the Supabase pieces they use (`auth.users`,
`auth.uid()`, the `anon`/`authenticated` roles and their default grants). It checks that
inserts, updates and deletes are logged with the right actor, that profile emails stay out
of the log, and that users and visitors cannot read or write it. `seed-real-teas.test.ts` runs
`supabase/seed/20261023_real_teas.sql` on the same setup: 18 teas, the one stated region
linked, every insert audited, and a rerun adding nothing.

## Contents

- `audit-log.test.ts`
- `seed-real-teas.test.ts`

## Parent

[test](../README.md)
