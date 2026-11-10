# lib

## Purpose

`metadata.ts` builds tea, taster and year-in-tea page metadata; `render.tsx` reads a tea, profile, public year, café or drink and returns the `ImageResponse` (café and drink slugs are validated first, and a malformed one gets the site card); `fetch-photo.ts` fetches a tea photo as a data URI (JPEG/PNG only, 4 MB cap, 3 s timeout, null on any failure); `fonts.ts` loads the committed Figtree files; `palette.ts` holds the DESIGN.md colours as hex, the image size and the tagline.

`cafe-share.test.ts` tests the café and drink metadata and JSON-LD. `json-ld.ts` also builds `cafeJsonLd` (`CafeOrCoffeeShop`, with `aggregateRating` only from taster reviews) and `drinkJsonLd` (`MenuItem`, no rating); `metadata.ts` adds `cafeMetadata` and `drinkMetadata`; `render.tsx` adds `renderCafeImage` and `renderDrinkImage`. `json-ld.ts` builds the `Product` structured data for a tea (`aggregateRating` only when rated) and serialises it safely for a `<script>` element.

## Contents

- `cafe-share.test.ts`
- `fetch-photo.ts`
- `fonts.ts`
- `json-ld.test.ts`
- `json-ld.ts`
- `metadata.test.ts`
- `metadata.ts`
- `palette.ts`
- `render.tsx`

## Parent

[share](../README.md)
