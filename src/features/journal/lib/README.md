# lib

## Purpose

Pure journal helpers: `computeJournalStats` (count, average, category split, top notes) and `groupByMonth` (by tasting date, newest first).

`storage-guidance.ts` holds `MAKER_GUIDANCE`, per-brand opened-tea guidance with the maker's own
source URL (Ippodo and Aiya; Marukyu Koyamaen states no figure, so it has none), and
`freshnessHint`, which falls back to general advice for any other maker. Add a maker only
when its own site states a figure.

## Contents

- `index.ts`
- `journal-stats.test.ts`
- `journal-stats.ts`
- `storage-guidance.test.ts`
- `storage-guidance.ts`

## Parent

[journal](../README.md)
