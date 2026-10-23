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
link). `orders` stays dormant.

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

## Parent

[supabase](../README.md)
