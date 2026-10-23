# lib

## Purpose

Pure functions, unit-tested. `teaSimilarity` compares two teas on what both record (category
weighs most, then sliders and notes, then grade and region). `predictMatch` takes a
similarity-squared weighted average of the taster's ratings of teas at least 0.25 alike,
shrinks it toward their mean, and maps it to a 0–100 chance of 4★+ (`matchBand`: 70+ great,
40–69 average, below 40 low, as Vivino bands it). `buildTasteProfile` reads each tea's latest
tasting and flags fewer than 5 teas as an early read.

## Contents

- `index.ts`
- `match.test.ts`
- `match.ts`
- `taste-profile.test.ts`
- `taste-profile.ts`

## Parent

[taste](../README.md)
