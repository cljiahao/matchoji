# api

## Purpose

`getSupplyOverview` reads every `tea_production_stats` row and the regions (to list each
prefecture's regions) and returns `summarizeSupply`'s overview. It is tested against the
recording fake Supabase client: success, an empty table, and either read failing.

## Contents

- `index.ts`
- `supply-service.test.ts`
- `supply-service.ts`

## Parent

[supply](../README.md)
