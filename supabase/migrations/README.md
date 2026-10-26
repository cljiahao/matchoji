# migrations

## Purpose

Versioned SQL migrations, applied in filename (timestamp) order. `audit_log` (from
`20261023000000_audit_log.sql`) is filled by triggers on every app table, meeting
`docs/CONSTITUTION.md`'s "all mutations write to an audit log"; a new table needs its own
`audit_row_change` trigger. `20261023100000_region_supply.sql` adds each region's
`matcha_supply` and `hojicha_supply` (scarce, tight or plentiful; null when unsourced), which
the scarcity sorts rank by. `20261023200000_tea_production_stats.sql` holds official tea
figures per prefecture and year (`cultivated_ha`, `aracha_t`, `tencha_t`), each tagged with
its `source` (`maff` or `zencharen`) and `source_ref`; everyone can read it, nobody can write
it through the API, and writes are audited. `20261024000000_stock_reports.sql` adds `products.shop_url`
(https only) and `stock_reports`: everyone reads, signed-in users insert their own, nobody
edits or deletes, and a trigger refuses a second report on the same tea from the same person
within 10 minutes. `20261024100000_marketplace_vendors_listings.sql` opens the Phase 3
`vendors` and `listings` tables: users apply for themselves (pending only) and can edit their
shop's details but not its status (column-level grants), approval is an admin's SQL update
that also sets `profiles.role`, approved shops and their listings are public, and only
approved vendors can add or change listings (price above zero, stock not negative, https buy
link). `orders` stays dormant. `20261024200000_tea_review_queue.sql`
adds `products.status` (existing teas approved, new ones pending), `added_by` and
`reviewed_at`: signed-in users can only add pending teas credited to themselves, approval is
an admin's SQL update, and a rejected tea is visible only to whoever added it.
`20261025000000_integrity_hardening.sql` is M0 of the 2026-10-24 roadmap: `public_profiles`
read-only; profiles editable only in `display_name` (1–40 characters) with defaults that never
use the email; `latest_reviews` and a `product_ratings` that count each person's latest tasting;
writes allowed only on catalogue teas (or a taster's own pending one); a pending tea cannot
carry a photo or shop link; review photos must be the author's own upload; length and date
checks; one entry per tea name and brand; rejected teas readable to people who tasted or saved
them; and `product_id` indexes. `20261025000001_storage_limits.sql` caps review photos at 5 MB
of image types and stops anyone listing the bucket (PGlite skips Storage migrations).
`20261025100000_admin_review.sql` adds `profiles.is_admin` (set by hand) and the admin
functions `review_tea`, `set_tea_links`, `merge_tea` and `review_vendor`, each checking the
flag, plus `reapply_as_vendor` for a rejected shop; reasons go in `review_note` and a merged
duplicate records `merged_into`. Admins can read every tea and shop.
`20261025100001_product_images_storage.sql` creates the `product-images` bucket, writable by
admins only. `20261025200000_catalogue_discovery.sql` adds `catalogue_teas` (approved teas
with region, rating, a weighted score, top and scarcity ranks), `pg_trgm` indexes on tea name
and brand, and `search_teas` (approved teas plus the caller's pending ones, typo-tolerant). `20261026000000_tea_taste_profiles.sql` adds `tea_taste_profiles`: each
tea's averaged sliders and note mentions from `latest_reviews`, the match score's input.
`20261026100000_account_and_review_edits.sql` lets authors edit (tasting fields only) and
delete their tastings, keeps a deleted account's ratings with `user_id` set null (each counting
as its own taster in `latest_reviews`), adds `delete_my_account()` (removes the account and
scrubs the person from the audit trail), and caps each person at 60 tastings and 20 suggested
teas a day. `20261027000000_social_profiles_follows.sql` adds `profiles.is_public` (exposed by
`public_profiles`), `blocks` (private to the blocker), `follows` (public; you follow for
yourself, never someone who blocked you or whom you blocked; blocking ends follows both ways)
and `following_feed()`. `20261027100000_social_reactions.sql` adds `review_likes` and
`review_comments` (for yourself, never across a block; a comment's author or the review's author
can delete it; 100 comments a day), `notifications` (written only by triggers on follows, likes,
comments and admin decisions; readers can only mark theirs read), and `content_reports` with
the admin-only `resolve_report()`, which removes or keeps the content and tells every reporter
why. `20261028000000_editions_and_stash.sql` adds `reviews.harvest_year` and `flush` (editable by
the author; `latest_reviews` recreated to carry them), the `edition_ratings` view with a
`top_harvest` flag (best edition with 3+ ratings), and the want-to-try stash
(`owned_quantity`, `opened_on`, owner-editable). `20261028100000_health_check.sql` adds
`health()`, a no-op anyone may call, which `/api/health` uses to prove the database answers.
`20261029000000_security_hardening.sql` closes the 2026-10-26 security sweep: the server stamps
`created_at` on API inserts (backdating no longer slips the daily limits), likes and follows get
daily limits, review photos must be a file in the author's folder on this project's storage, a
private taster's reviews are readable only by them and admins (tea pages get them through
`product_reviews()` without author or photo; scores read every row through the unexposed
`internal.latest_reviews`), follows between private people are hidden, `is_blocked_between`
answers only for pairs including the caller and reaction policies use `can_react_to` /
`is_review_author` instead of `review_author`, account deletion also scrubs follow, block,
report, notification and photo ids from the audit trail, suggested teas and shop applications
cannot carry admin-only fields, and `handle_new_user` uses an empty `search_path`.

## Contents

- `20260914071129_phase1_schema.sql`
- `20260914071152_phase1_storage.sql`
- `20261014000000_phase1_public_profiles_and_regions.sql`
- `20261021000000_tasting_journal.sql`
- `20261023000000_audit_log.sql`
- `20261023100000_region_supply.sql`
- `20261023200000_tea_production_stats.sql`
- `20261024000000_stock_reports.sql`
- `20261024100000_marketplace_vendors_listings.sql`
- `20261024200000_tea_review_queue.sql`
- `20261025000000_integrity_hardening.sql`
- `20261025000001_storage_limits.sql`
- `20261025100000_admin_review.sql`
- `20261025100001_product_images_storage.sql`
- `20261025200000_catalogue_discovery.sql`
- `20261026000000_tea_taste_profiles.sql`
- `20261026100000_account_and_review_edits.sql`
- `20261027000000_social_profiles_follows.sql`
- `20261027100000_social_reactions.sql`
- `20261028000000_editions_and_stash.sql`
- `20261028100000_health_check.sql`
- `20261029000000_security_hardening.sql`

## Parent

[supabase](../README.md)
