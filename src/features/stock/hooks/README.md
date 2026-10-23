# hooks

## Purpose

`useStockReport` starts from the report the page rendered on the server, reports through a
TanStack mutation and swaps the new report in on success. Signed-out visitors get the
sign-in prompt instead; the database's "reported a moment ago" message is shown as is, other
failures get a generic retry toast.

## Contents

- `index.ts`
- `use-stock-report.ts`

## Parent

[stock](../README.md)
