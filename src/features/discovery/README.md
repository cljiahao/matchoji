# discovery

## Purpose

Vivino-style discovery built only from Matchoji's own ratings and prices, no AI or third party.
Tea-page highlights ("Top 10% of hojicha on Matchoji", "Highest rated from Uji", "Most rated
ceremonial matcha"), a "Similar teas" shelf and the `/top` lists. Value scoring lives in
`products` (`value-score`), since Explore and its badge use it. Everything here degrades to
hidden: a claim needs enough ratings and a big enough comparison group, and a list needs
enough teas, so a small catalogue shows nothing rather than something misleading.

## Contents

- `api/`
- `components/`
- `index.ts`
- `lib/`
- `test-utils.ts`

## Connectivity

Depends on `products` (the catalogue, value scores, the shelf and row UI) and `taste` (feature
loading and taste closeness). The tea page, `/top`, the home shelves' "See all" and the
sitemap use it. `test-utils.ts` builds catalogue-tea fixtures for the tests.

## Parent

[features](../README.md)
