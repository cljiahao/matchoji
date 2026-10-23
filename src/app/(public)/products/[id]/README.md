# [id]

## Purpose

One product's detail page, in Vivino's order: a category-tinted hero (tile, brand, name,
score, "Rate it" stars, "Want to try", and `StockPanel` with the latest community stock
report and a link to the maker's shop), "What does it taste like?" (`ProductInsights`),
facts, photos, and `CommunityReviews` (the `#rate` anchor sign-in returns to). The product, its reviews and its latest stock report load
from Supabase in parallel; an unknown id 404s.

## Contents

- `loading.tsx`
- `page.tsx`

## Parent

[products](../README.md)
