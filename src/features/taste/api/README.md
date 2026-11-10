# api

## Purpose

`loadMatches` reads the taster's latest ratings (`latest_reviews`), then the catalogue entry
and community profile (`tea_taste_profiles`) of every tea involved, and scores each candidate.
It skips the feature reads for someone who has rated nothing.

`loadTeaFeatures` is the shared step that builds a tea's features (catalogue entry plus community profile); `discovery` calls it to rank similar teas.

`loadMatches` reads tea ratings only (`product_id` not null), so a drink rating neither scores a tea nor counts as having rated.

## Contents

- `index.ts`
- `taste-service.test.ts`
- `taste-service.ts`

## Parent

[taste](../README.md)
