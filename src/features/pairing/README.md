# pairing

## Purpose

"Goes well with" on a tea's page: sweets a tea house itself pairs with this kind of tea. The
rules are a typed constant (`rules.ts`), not a table, and each cites the maker's page it
restates (all Ippodo); a pairing no tea house states is left out. Matching is by category, and
matcha graded for lattes or baking (`culinary`, `latte`, `barista`...) is skipped because no
sourced rule covers it. Nothing renders when no rule matches.

## Contents

- `components/`
- `index.ts`
- `match.test.ts`
- `match.ts`
- `rules.ts`
- `types.ts`

## Connectivity

Depends on `products` (the category type). The tea page uses it.

## Parent

[features](../README.md)
