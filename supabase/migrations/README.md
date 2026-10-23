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
admins only.

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

## Parent

[supabase](../README.md)
