# lib

## Purpose

Pure journal helpers: `computeJournalStats` (count, distinct teas, average, category split, top notes, and, from 3 tastings, top maker, region and preparation, where the winner must appear at least twice and ties go to the most recent; plus tasting days and the longest run this month), `computePublicStats` (counts per distinct tea, for `/u/[id]`) and `groupByMonth` (by tasting date, newest first).

`year-in-tea.ts` builds the yearly recap from the whole journal: totals, first and latest tasting, highest rated (ties to the later tasting), busiest month (ties to the later month), the newest maker first tried that year, and how the liked taste profile moved against earlier years (no comparison in a first year). `YEAR_MIN_TASTINGS` (3) is the threshold below which a year has no recap. `toYearCard` reduces a recap to counts and tea names for the share card.

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
- `year-in-tea.test.ts`
- `year-in-tea.ts`

## Parent

[journal](../README.md)
