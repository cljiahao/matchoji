# db

## Purpose

Every file builds its database with `createMigratedDb()` from `test/support/supabase-db.ts`.
Database tests: `audit-log.test.ts` applies `supabase/migrations/` (storage excepted) to an
in-process PGlite Postgres, with a stub of the Supabase pieces they use (`auth.users`,
`auth.uid()`, the `anon`/`authenticated` roles and their default grants). It checks that
inserts, updates and deletes are logged with the right actor, that profile emails stay out
of the log, and that users and visitors cannot read or write it. `label-scans.test.ts` checks scans are private to whoever sent them, that only the id can be set by the client, and the 20-a-day cap. `catalogue-expansion.test.ts` runs the data-only `20261104000000_catalogue_expansion.sql` (which `createMigratedDb()` skips, so other tests start from an empty catalogue): 31 approved teas each with a shop link and price, no duplicates, regions only where stated, 4 more shops, and a rerun or a differently-cased tea adding nothing. `seed-real-teas.test.ts` runs
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
and the per-tea indexes exist. `admin-review.test.ts` checks users cannot make themselves
admin, only admins can review, link or merge teas and review shops, reasons reach the
submitter, a merge moves tastings, saves and listings and forwards the duplicate, and a
rejected shop can reapply once. `catalogue-discovery.test.ts` checks the weighted ranking
(three ratings beat one), that the view lists approved teas with their region and scarcity,
and that `search_teas` forgives typos, treats wildcards as text and shows only the caller's
own pending teas. `tea-taste-profiles.test.ts` checks the profile averages sliders and counts
notes over each person's latest tasting only. `health-check.test.ts` checks visitors and
signed-in users can call `health()`. `security-hardening.test.ts` proves each sweep fix: server
timestamps, the strict photo check, private tasters' reviews hidden yet counted and listed
anonymously, follows and feeds, block lookups, reaction policies, account-deletion scrubbing
and admin-only fields. `lesson-progress.test.ts` checks lesson progress is private, recorded only for the
signed-in learner with a server time and valid slugs, unmarkable only by its owner, audited and
deleted with the account. `tea-prices.test.ts` checks only admins set prices (both values or neither,
within range), suggested teas arrive unpriced, the per-gram figure and bands (none until 3 teas of a
category are priced), pending teas left out of the comparison, and that price changes are audited. `tea-price-history.test.ts` checks the trigger records a priced insert and each price or pack-size change but not a no-change or clearing update, history goes with the tea, everyone can read it, no client can write it, and it is audited. `cafes-and-drinks.test.ts` covers the café-drinks schema: the two seeded cities, pending-only suggestions and their caps, generated slugs, currency by city, exactly one review target, trusted-taster rules (Instagram link, disclosure, unspoofable flag, forced public profile), `drink_ratings` and `cafe_ratings` counting each person's latest review and keeping taster and community scores apart, private authors hidden, merges (including the different-city and unapproved-clash refusals), moderation notifications, tea views unaffected, the audit log, and the security-review fixes: account deletion unlinking a taster's reviews and scrubbing the audit log, rejected cafés hiding their drinks, visitors blocked from `added_by` and `review_note`, no self-approval, no access to the internal merge or admin RPCs, and `update_cafe` and `update_drink`.

`admin-review.test.ts` also covers photo credits: set, kept on a null image, cleared with the photo, the 120-character limit, admin-only, and refused on a suggested tea.

## Contents

- `account-and-review-edits.test.ts`
- `admin-review.test.ts`
- `audit-log.test.ts`
- `catalogue-expansion.test.ts`
- `catalogue-discovery.test.ts`
- `editions-and-stash.test.ts`
- `health-check.test.ts`
- `integrity-hardening.test.ts`
- `lesson-progress.test.ts`
- `region-supply.test.ts`
- `security-hardening.test.ts`
- `seed-real-teas.test.ts`
- `social-profiles-follows.test.ts`
- `social-reactions.test.ts`
- `tea-price-history.test.ts`
- `tea-prices.test.ts`
- `marketplace.test.ts`
- `stock-reports.test.ts`
- `tea-review-queue.test.ts`
- `tea-taste-profiles.test.ts`
- `tea-production-stats.test.ts`
- `cafes-and-drinks.test.ts`

## Parent

[test](../README.md)
