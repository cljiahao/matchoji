# api

## Purpose

`listSimilarTeas` ranks a tea's same-category peers from the catalogue the caller already read,
adding community taste (via `taste`'s `loadTeaFeatures`) to break ties. If the taste read fails it
falls back to category, grade and region, so the shelf still shows. Tested against the fake
Supabase client. The catalogue itself comes from `products`' `listCatalogue`.

## Contents

- `index.ts`
- `similar-service.test.ts`
- `similar-service.ts`

## Parent

[discovery](../README.md)
