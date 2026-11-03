# public

## Purpose

Static assets served directly by Next.js from the site root.

## Contents

- `image_assets/`
- `sw.js`

`sw.js` is the service worker (see `src/features/offline`), served uncached by `next.config.ts`.

## Connectivity

`image_assets/` is the only subfolder — it holds the images the `BrandLogo` and `FloatingShape` widgets (`src/components/widgets/`) reference.

## Parent

[matchoji](../README.md)
