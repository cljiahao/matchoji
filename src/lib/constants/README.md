# constants

## Purpose

Environment-derived and route-path constants shared across the app. `SITE_URL` is the public
origin for absolute URLs (the base URL, else Vercel's production domain, else localhost). `env.ts` also reads the Sentry settings: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` (a DSN is public by design) and the build-only `SENTRY_AUTH_TOKEN`. `MARKETPLACE_ENABLED` (false) is the one switch that hides the parked marketplace surfaces (`/sell`, "Where to buy", the sitemap entry); the tables and code stay. `anthropicApiKey()` reads the server-only `ANTHROPIC_API_KEY` at call time (unset turns label scanning off). `routes.ts` lists the page
routes (`/`, `/explore`, `/regions`, `/regions/supply`, `/journal`, `/learn`, `/sell`, `/account`); dynamic product pages are built inline as `/products/<id>`, and Learn's recipe and guide paths by `features/learn`'s `recipeHref` / `guideHref`.

`PAGE_ROUTES.TOP` is the top-lists index.
`PAGE_ROUTES.SHOPS` is `/shops`, the in-person shop map; `PAGE_ROUTES.CAFES` is `/cafes`, the café list.

`PAGE_ROUTES.TASTERS` is `/tasters` and `PAGE_ROUTES.HOW_WE_RATE` is `/about/how-we-rate`.

## Contents

- `env.ts`
- `index.ts`
- `routes.ts`

## Parent

[lib](../README.md)
