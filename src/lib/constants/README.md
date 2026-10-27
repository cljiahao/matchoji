# constants

## Purpose

Environment-derived and route-path constants shared across the app. `SITE_URL` is the public
origin for absolute URLs (the base URL, else Vercel's production domain, else localhost). `routes.ts` lists the page
routes (`/`, `/explore`, `/regions`, `/regions/supply`, `/journal`, `/learn`, `/sell`, `/account`); dynamic product pages are built inline as `/products/<id>`, and Learn's recipe and guide paths by `features/learn`'s `recipeHref` / `guideHref`.

## Contents

- `env.ts`
- `index.ts`
- `routes.ts`

## Parent

[lib](../README.md)
