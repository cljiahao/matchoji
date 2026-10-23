# taste

## Purpose

Vivino's "Match for You" and "Your taste" for tea (M2 of the 2026-10-24 roadmap). The match
score is the chance a taster rates a tea 4★ or more, predicted from their own latest ratings
of the most similar teas (tea type, grade, region, the community's taste sliders and flavour
notes) and shrunk toward their average when the evidence is thin; it always names the
ratings behind it. The taste profile summarises a journal: favourite notes, loved versus
disliked taste, teas per category and favourite preparation.

## Contents

- `api/`
- `components/`
- `index.ts`
- `lib/`
- `types.ts`

## Connectivity

Depends on `products` (category styles, types) and `reviews` (tasting vocabulary). Tea pages,
Explore (badges and the "Best match for you" sort) and the journal use it.

## Parent

[features](../README.md)
