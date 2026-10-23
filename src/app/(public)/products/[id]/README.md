# [id]

## Purpose

One product's detail page, in Vivino's order: a category-tinted hero (tile, brand, name,
score, "Rate it" stars, "Want to try", and `StockPanel` with the latest community stock
report and a link to the maker's shop), "What does it taste like?" (`ProductInsights`),
"Where to buy" (`WhereToBuy`, approved vendors' listings), facts, photos, and `CommunityReviews` (the `#rate` anchor sign-in returns to). The product, its reviews, its latest stock report and its
offers load from Supabase in parallel; an unknown id 404s. A tea awaiting review shows "Awaiting review"
under its badges (like Vivino's "processing" label on an unmatched scan); a rejected one,
visible only to the taster who added it, says it was not added to the catalogue. Rating and want-to-try appear only on catalogue teas
or, for a tea awaiting review, to whoever added it; stock and "Where to buy" only on catalogue
teas. A malformed id 404s before any query. A merged duplicate forwards permanently to the tea
it repeated, and a rejected tea shows the admin's reason to whoever added it. `generateMetadata` titles
the page "Name · Brand", describes its rating, uses its photo for link previews and keeps teas
outside the catalogue out of search engines; the product read is shared with the page through
React `cache`.

## Contents

- `loading.tsx`
- `page.tsx`

## Parent

[products](../README.md)
