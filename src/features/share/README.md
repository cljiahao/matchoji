# share

## Purpose

How Matchoji looks when a link is shared. `lib/metadata.ts` builds the title, description, Open Graph and `summary_large_image` Twitter metadata for a tea (`teaMetadata`) and a taster (`profileMetadata`); the preview image itself comes from each route's `opengraph-image` file, which calls `renderSiteImage`, `renderTeaImage` or `renderProfileImage` (1200×630, `next/og`). A tea card shows the name, maker, a matcha or hojicha chip, the rating with its count or "Not yet rated", and the tea's photo, or the drawn tin when it has none or the photo is not a JPEG/PNG or is slow to load. A profile card shows the name and teas rated; a private or unknown profile falls back to the site card, so nothing private reaches an image. Images are read with no session, as a crawler would.

`components/logo-mark.tsx` is also what draws the app icons under `/icons`.

`teaJsonLd` and `serializeJsonLd` (`lib/json-ld.ts`) build the schema.org `Product` block a catalogue tea's page embeds.

## Contents

- `components/`
- `fonts/`
- `index.ts`
- `lib/`

## Connectivity

Depends on `products` (tea read, tin design) and `social` (profile read) through their `index.ts`. Used by the root `opengraph-image`, the `/products/[id]` and `/u/[id]` pages and image files, the manifest and the `/icons` route.

## Parent

[features](../README.md)
