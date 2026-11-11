# cafes

## Purpose

Café drinks: Singapore and Johor Bahru cafés, the hojicha and matcha drinks on their menus, and how well tasters and the community rate each drink. Taster and community scores are separate everywhere (`ScorePair` shows both side by side, never averaged), and a disclosed taster review (invited, gifted or paid) still counts, with "n paid/gifted" under the taster review count. Every count is a review (one latest review per person and drink), the unit the average is taken over. A pending café or drink shows an "Awaiting review" notice (`PendingNotice`) to its submitter instead of the score and rating button; everyone else gets 404.

`types.ts` defines `Cafe`, `Drink`, their `…Listing` forms with scores, `ScorePair` (exported as `ScorePairData` because the component takes the name `ScorePair`) and the page results. A page result is `found`, `redirect` or `missing`: a merged café or drink forwards to its survivor and a rejected drink to its café, so a link posted to Instagram never 404s. No migration; the schema comes from the S1 café migration, and every read returns empty before it is applied.

The write side: a signed-in person logs a café drink by finding or adding the café, finding or adding the drink, then rating it (`DrinkLogFlow`, opened from the app-wide `LogDialog` widget or from a drink page's `RateThisDrink`). A trusted taster must also give the link to their Instagram post and say whether the drink was gifted, paid or invited, with no answer preselected; everyone else sees neither field. Schemas in `schemas/` validate every form, `hooks/` wraps the mutations and searches, and the database's own pending-review cap is shown as a plain message.

## Contents

- `api/`
- `components/`
- `hooks/`
- `index.ts`
- `lib/`
- `schemas/`
- `types.ts`

## Connectivity

Depends on `reviews` (review rows and `drinkHref`, which `reviews` owns because it cannot import this feature) and `products` (score numeral, category styles, tea name for "Tea used here"), through their `index.ts`. Used by the `/cafes` pages, the `/c/[slug]` short link, `share` (metadata, JSON-LD and link-preview images) and the sitemap.

## Parent

[features](../README.md)
