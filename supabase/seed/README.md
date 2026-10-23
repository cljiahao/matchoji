# seed

## Purpose

Data, not schema: SQL run by hand in the Supabase SQL editor to fill the catalogue.
`20261023_real_teas.sql` adds 18 real matcha and hojicha teas from Ippodo, Marukyu Koyamaen
and Aiya, named as the makers list them. Region and grade are set only where the maker
states them. It is safe to rerun: teas already present (same name and brand, ignoring case)
are skipped. No ratings are seeded; those come from real tastings.

`20261023_tea_grades.sql` then grades the matcha as the makers classify them: Koicha (suits
thick tea) or Usucha (thin tea only). It fills only empty grades and is safe to rerun.
Regions stay empty because neither maker states where a single product is grown.

## Contents

- `20261023_real_teas.sql`
- `20261023_tea_grades.sql`

## Parent

[supabase](../README.md)
