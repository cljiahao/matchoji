# constants

## Purpose

Environment-derived and route-path constants shared across the app. `SITE_URL` is the public
origin for absolute URLs (the base URL, else Vercel's production domain, else localhost). `routes.ts` lists the page
routes (`/`, `/explore`, `/regions`, `/regions/supply`, `/journal`, `/sell`, `/account`); dynamic product pages are built inline as `/products/<id>`.

## Contents

- `env.ts`
- `index.ts`
- `routes.ts`

## Parent

[lib](../README.md)
