# cafes

## Purpose

The read side of café drinks: Singapore and Johor Bahru cafés, the hojicha and matcha drinks on their menus, and how well tasters and the community rate each drink. Taster and community scores are separate everywhere (`ScorePair` shows both side by side, never averaged), and a disclosed taster review (gifted, paid or invited) still counts, with "n of m taster reviews were gifted/paid" under the score.

`types.ts` defines `Cafe`, `Drink`, their `…Listing` forms with scores, `ScorePair` (exported as `ScorePairData` because the component takes the name `ScorePair`) and the page results. A page result is `found`, `redirect` or `missing`: a merged café or drink forwards to its survivor and a rejected drink to its café, so a link posted to Instagram never 404s. No migration; the schema comes from the S1 café migration, and every read returns empty before it is applied.

## Contents

- `api/`
- `components/`
- `index.ts`
- `lib/`
- `types.ts`

## Connectivity

Depends on `reviews` (review rows and `drinkHref`, which `reviews` owns because it cannot import this feature) and `products` (score numeral, category styles, tea name for "Tea used here"), through their `index.ts`. Used by the `/cafes` pages, the `/c/[slug]` short link, `share` (metadata, JSON-LD and link-preview images) and the sitemap.

## Parent

[features](../README.md)
