# api

## Purpose

`getLatestStockReport` reads a tea's newest `stock_reports` row (server or browser client);
`reportStock` inserts one for the signed-in user, leaving `user_id` to the column default so
RLS decides who it belongs to. Tested against the recording fake Supabase client: a report,
none, a read error, an insert, and a refused insert.

## Contents

- `index.ts`
- `stock-service.test.ts`
- `stock-service.ts`

## Parent

[stock](../README.md)
