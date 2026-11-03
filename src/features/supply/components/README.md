# components

## Purpose

`Sparkline`: one series as a thin line with an end dot, no axes or legend (the card names
it). Every year has a hover target with a native tooltip, so it works in a Server Component,
and the SVG's label gives screen readers the first and last values. The page's "All figures"
table is the full table view. Optional `summary`, `formatValue` and per-point `label` let another series (a tea's price per gram by month) supply its own description and tooltips.

## Contents

- `index.ts`
- `sparkline.test.tsx`
- `sparkline.tsx`

## Parent

[supply](../README.md)
