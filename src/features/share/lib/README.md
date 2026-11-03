# lib

## Purpose

`metadata.ts` builds tea and taster page metadata; `render.tsx` reads a tea or profile and returns the `ImageResponse`; `fetch-photo.ts` fetches a tea photo as a data URI (JPEG/PNG only, 4 MB cap, 3 s timeout, null on any failure); `fonts.ts` loads the committed Figtree files; `palette.ts` holds the DESIGN.md colours as hex, the image size and the tagline.

`json-ld.ts` builds the `Product` structured data for a tea (`aggregateRating` only when rated) and serialises it safely for a `<script>` element.

## Contents

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
