# cafes

## Purpose

`/cafes`: hojicha and matcha cafés in the visitor's city, with a map, an area filter and a taster-reviewed-only filter in the URL (`?city=&area=&taster=1`). The city is `?city=`, else the `matchoji-city` cookie, else Singapore. With no cafés it says none are listed in that city yet. `[slug]/` is a café page (drinks with scores, latest trusted-taster reviews, map, Instagram and website links) and `[slug]/[drink]/` a drink page (taster block first, then community, the tea used, similar drinks). Both forward a merged or rejected page and call `notFound()` for a malformed or unknown slug. Each has an `opengraph-image.tsx`, JSON-LD for approved pages and its own metadata, and a `loading.tsx` skeleton announced as a busy `status`. The "Rate this drink" slot on the drink page is left empty for the log flow.

## Contents

- `[slug]/`
- `loading.tsx`
- `page.test.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
