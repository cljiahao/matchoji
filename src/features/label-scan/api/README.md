# api

## Purpose

Server-side steps of a scan: `readLabel` calls the Claude API through `@anthropic-ai/sdk` with a Zod structured-output format and returns null when nothing legible came back; `recordScan` inserts a `label_scans` row, whose trigger enforces 20 a day (`limited` on error code `P0001`); `matchLabel` searches the catalogue and scores candidates.

## Contents

- `index.ts`
- `label-reader.ts`
- `match-label.ts`
- `scan-limit.ts`

## Connectivity

Used by `src/app/api/label-scan/route.ts` via `../server.ts`. Catalogue search goes through `products`.

## Parent

[label-scan](../README.md)
