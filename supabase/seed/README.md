# seed

## Purpose

Data, not schema: SQL run by hand in the Supabase SQL editor to fill the catalogue.
`20261023_real_teas.sql` adds 18 real matcha and hojicha teas from Ippodo, Marukyu Koyamaen
and Aiya, named as the makers list them. Region and grade are set only where the maker
states them, and the teas are inserted as approved, skipping the review queue. It is safe to rerun: teas already present (same name and brand, ignoring case)
are skipped. No ratings are seeded; those come from real tastings.

`20261023_tea_grades.sql` then grades the matcha as the makers classify them: Koicha (suits
thick tea) or Usucha (thin tea only). It fills only empty grades and is safe to rerun.
Regions stay empty because neither maker states where a single product is grown.

`20261023_region_supply.sql` (run after the `20261023100000_region_supply` migration) sets
each region's matcha and hojicha supply level and a one-line note, from public reporting on
the 2024-2026 shortage; sources are listed in the file. Matcha levels are set only where a
source covers the region (Uji scarce; Nishio, Kagoshima and Shizuoka tight). Hojicha is tight
everywhere, since the bancha shortage is reported nationwide. It fills only empty fields.

`20261023_tea_production_stats.sql` (after the `20261023200000_tea_production_stats`
migration) loads 147 official figures for the 7 prefectures Matchoji's regions sit in, plus
Japan: tea fields 2016-2026 and raw tea 2018-2025 from MAFF's crop statistics, and 2025 tencha
from the national growers' federation. The header lists every e-Stat file (statInfId) it was
read from. To add a year, download the new files the same way, append their rows and rerun:
it adds new rows, updates revised values and leaves the rest untouched.

`20261024_shop_urls.sql` (after the `20261024000000_stock_reports` migration) links each
seeded tea to its page on the maker's shop: Ippodo's global store, Marukyu Koyamaen's English
shop, and Aiya's US shop home page. It fills only empty links and is safe to rerun.

## Contents

- `20261023_real_teas.sql`
- `20261023_region_supply.sql`
- `20261023_tea_production_stats.sql`
- `20261024_shop_urls.sql`
- `20261023_tea_grades.sql`

## Parent

[supabase](../README.md)
