# schemas

## Purpose

Zod schemas for every café form, validated at the boundary. `cafeSchema` (name, city, area, address, Instagram handle without the "@" (never only dots), https website), `drinkSchema` (name, tea, style, serving, price to two decimals) and `drinkReviewSchemaFor({ isTaster, base })`. A drink review has stars, notes, flavour notes from the base's list, four 1-5 scales, a roast scale (hojicha only; dropped for matcha) and a date that is not in the future. For a trusted taster the schema also requires an `https://www.instagram.com/p/…` or `/reel/…` link and a disclosure with no default, so a gifted drink cannot go out as "none" by accident; for everyone else those fields do not exist. `DrinkReviewInput` and `DrinkReviewOutput` are the form's shared types (`z.input` and `z.infer`). `fields.ts` holds the blank-to-undefined helpers.

## Contents

- `cafe.schema.test.ts`
- `cafe.schema.ts`
- `drink-review.schema.test.ts`
- `drink-review.schema.ts`
- `drink.schema.ts`
- `fields.ts`
- `index.ts`

## Parent

[cafes](../README.md)
