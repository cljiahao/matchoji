# share

## Purpose

How Matchoji looks when a link is shared. `lib/metadata.ts` builds the title, description, Open Graph and `summary_large_image` Twitter metadata for a tea (`teaMetadata`), a taster (`profileMetadata`) and a year in tea (`yearMetadata`); the preview image itself comes from each route's `opengraph-image` file, which calls `renderSiteImage`, `renderTeaImage` or `renderProfileImage` (1200×630, `next/og`). A tea card shows the name, maker, a matcha or hojicha chip, the rating with its count or "Not yet rated", and the tea's photo, or the drawn tin when it has none or the photo is not a JPEG/PNG or is slow to load. A profile card shows the name and teas rated; a year card (`renderYearImage`, behind `/u/[id]/year/[year]`) shows a public taster's tastings, teas, matcha/hojicha split, busiest month and top-rated tea, never a note; a private or unknown profile falls back to the site card, so nothing private reaches an image. Images are read with no session, as a crawler would.

`cafeMetadata`, `drinkMetadata`, `renderCafeImage` and `renderDrinkImage` do the same for café and drink pages (`CafeCard` and `DrinkCard`): the taster score leads, a community score appears only when there is no taster score and is labelled as the community's, the two are never blended, and a disclosed-review line shows when it applies. A café or drink that is missing, forwarded or not approved shares the site card, and its metadata is `noindex`.

`components/logo-mark.tsx` is also what draws the app icons under `/icons`.

`teaJsonLd` and `serializeJsonLd` (`lib/json-ld.ts`) build the schema.org `Product` block a catalogue tea's page embeds.

## Contents

- `components/`
- `fonts/`
- `index.ts`
- `lib/`

## Connectivity

Depends on `products` (tea read, tin design), `social` (profile read) and `cafes` (café and drink reads) through their `index.ts`. Used by the root `opengraph-image`, the `/products/[id]` and `/u/[id]` pages and image files, the manifest and the `/icons` route.

## Parent

[features](../README.md)
