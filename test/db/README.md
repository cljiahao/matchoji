# db

## Purpose

Database tests: `audit-log.test.ts` applies `supabase/migrations/` (storage excepted) to an
in-process PGlite Postgres, with a stub of the Supabase pieces they use (`auth.users`,
`auth.uid()`, the `anon`/`authenticated` roles and their default grants). It checks that
inserts, updates and deletes are logged with the right actor, that profile emails stay out
of the log, and that users and visitors cannot read or write it. `seed-real-teas.test.ts` runs
`supabase/seed/20261023_real_teas.sql` on the same setup: 18 teas, the one stated region
linked, every insert audited, and a rerun adding nothing; then the grades script: 4 Koicha, 4 Usucha, a hand-set grade
kept, Yugen left ungraded. `region-supply.test.ts` checks the supply columns reject unknown
levels and that `20261023_region_supply.sql` sets the sourced levels and notes, keeps values
set by hand, and is safe to rerun. `tea-production-stats.test.ts` loads the stats seed (147
rows, each audited), checks a rerun rewrites only a revised value, that unknown metrics and
sources are rejected, and that visitors can read but not insert or update. `stock-reports.test.ts` checks the
shop-link seed (every tea linked, hand-set links kept, https only) and `stock_reports`: own
reports only, audited, the 10-minute repeat brake, status values, visitors read-only, no
edits or deletes. `marketplace.test.ts` walks a vendor through applying (self-approval and
applying for others refused), staying private while pending, approval (public shop, vendor
role), listing (once per tea, others cannot edit), value checks, and rejection hiding the
listings and reverting the role, with every change audited. `tea-review-queue.test.ts` checks seeded teas are approved,
a taster's tea is pending and credited to them, nobody can add a tea as approved or credit
someone else, a pending tea stays readable by link but only an admin can approve it, and a
rejected tea is hidden from everyone but whoever added it. `integrity-hardening.test.ts`
proves M0: `public_profiles` cannot be written, users change only their display name, default
names skip the email, scores count latest tastings, writes refuse other people's pending and
any rejected tea, suggested teas carry no photo or link, duplicates and over-long values are
refused, review photos must be the author's own, rejected teas stay visible to their tasters,
and the per-tea indexes exist.

## Contents

- `audit-log.test.ts`
- `integrity-hardening.test.ts`
- `region-supply.test.ts`
- `seed-real-teas.test.ts`
- `marketplace.test.ts`
- `stock-reports.test.ts`
- `tea-review-queue.test.ts`
- `tea-production-stats.test.ts`

## Parent

[test](../README.md)
