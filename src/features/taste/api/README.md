# api

## Purpose

`loadMatches` reads the taster's latest ratings (`latest_reviews`), then the catalogue entry
and community profile (`tea_taste_profiles`) of every tea involved, and scores each candidate.
It skips the feature reads for someone who has rated nothing.

## Contents

- `index.ts`
- `taste-service.test.ts`
- `taste-service.ts`

## Parent

[taste](../README.md)
