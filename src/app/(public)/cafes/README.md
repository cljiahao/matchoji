# cafes

## Purpose

`/cafes`: hojicha and matcha cafés in the visitor's city, with a map, an area filter and a taster-reviewed-only filter in the URL (`?city=&area=&taster=1`). The city is `?city=`, else the `matchoji-city` cookie, else Singapore. With no cafés it says none are listed in that city yet. `[slug]/` is a café page (drinks with scores, latest trusted-taster reviews, map, Instagram and website links) and `[slug]/[drink]/` a drink page (taster block first, then community, the tea used, similar drinks). Both forward a merged or rejected page and call `notFound()` for a malformed or unknown slug. Each has an `opengraph-image.tsx`, JSON-LD for approved pages and its own metadata, and no `loading.tsx` of their own. The list page and its `loading.tsx` sit in the `(list)` group so the skeleton never wraps a page that redirects or calls `notFound()`: a streamed response has already sent its 200. The "Rate this drink" slot on the drink page is left empty for the log flow.

## Contents

- `(list)/`
- `[slug]/`

## Parent

[(public)](../README.md)
