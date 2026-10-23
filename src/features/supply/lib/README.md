# lib

## Purpose

`summarizeSupply` turns stats rows into a national figure and per-prefecture summaries: MAFF
series for tea fields and raw tea (oldest year first), and the growers' federation's latest
tencha figure with its share of that federation's own all-tea total, so the two surveys are
never mixed. Prefectures are ordered by tencha, then raw tea. `percentChange` and
`formatChange` give the "−4% since 2016" notes.

## Contents

- `index.ts`
- `summarize-supply.test.ts`
- `summarize-supply.ts`

## Parent

[supply](../README.md)
