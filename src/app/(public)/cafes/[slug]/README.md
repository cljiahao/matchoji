# [slug]

## Purpose

One café: name, area, address, Instagram handle and website links, its taster and community scores, a map pin, its drinks, and the latest trusted-taster reviews. A merged café permanently redirects to the one that absorbed it; a rejected, unknown or malformed slug is `notFound()`. `generateMetadata` and the page share one read through `cache`. `[drink]/` holds the drink pages. A pending café shows its submitter the "Awaiting review" notice in place of the score. The café's JSON-LD carries its menu (`hasMenu`, with a price `offers` where a drink has one) and an `image` only from a real drink photo.

## Contents

- `[drink]/`
- `opengraph-image.tsx`
- `page.test.tsx`
- `page.tsx`

## Parent

[cafes](../README.md)
