# lib

## Purpose

Pure functions, unit-tested. `ranking`: `bayesianScore` is `(v·R + 5·C) / (v + 5)` (the same prior
as the `catalogue_teas` view's `weighted_score`), where C is the mean of all rated teas' averages;
`rankTeas` orders teas with at least 3 ratings by it. `highlights`: `buildHighlights` returns up to
3 true lines for a tea with at least 5 ratings, each from a comparison group of at least 5 teas
with 3 ratings each: "Highest rated {category} on Matchoji" (or "Top 10%" / "Top 25%"), "Highest
rated from {region}" and "Most rated {grade} {category}"; ties never earn a "highest". `similar`:
`rankSimilar` keeps same-category teas and orders them by shared grade, shared region, taste
closeness (`taste`'s `tasteCloseness`; teas without taste data last), rating count, then name, up
to 8. `top-lists`: `buildTopLists` returns only lists that qualify: Top matcha, Top hojicha,
Best value matcha / hojicha (ranked by value score) and one "Top from {region}" per region
(slug `from-<region>`), each needing at least 5 teas with 3 ratings each (value lists: 5 teas
scoreable for value), capped at 20 teas. `findTopList` is null for a hidden list.

## Contents

- `highlights.test.ts`
- `highlights.ts`
- `index.ts`
- `ranking.test.ts`
- `ranking.ts`
- `similar.test.ts`
- `similar.ts`
- `top-lists.test.ts`
- `top-lists.ts`

## Parent

[discovery](../README.md)
