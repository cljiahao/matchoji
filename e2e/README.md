# e2e

## Purpose

Read-only Playwright smoke tests of the live site, run with `pnpm e2e` against
`E2E_BASE_URL` (production, https://matchoji.vercel.app, by default; Vercel previews are
login-gated). They cover the café-first home and its "Brew it at home" row, header search into Explore, a tea page (name, rating,
similar teas, `Product` JSON-LD), `/regions` and `/shops` ("Tea shops": map container and list), `/cafes` (with its city switch), an unknown `/c/<slug>` (a 308 to the café page, which answers a real 404), `/tasters`, `/about/how-we-rate`, `/top`, `/top/teas`, the old `/top/<tea>` 308,
"Log a drink" asking a signed-out visitor to sign in, the theme toggle going dark, and
`robots.txt` / `sitemap.xml`. None needs data: the Explore, search, tea page, regions, shops, cafés and tasters steps pass on an
empty database by accepting the page's empty-state message, so the suite also holds against a fresh local `pnpm dev`
(`E2E_BASE_URL=http://localhost:3000`). They never sign in and never write data. `fixtures.ts` makes every
test also fail on a console error, an uncaught page error or a `securitypolicyviolation`, so the
nonce and `strict-dynamic` policy stays honest. Desktop and mobile (Pixel 7) projects both run; the
header search test is desktop only. Vitest ignores this folder.

## Contents

- `fixtures.ts`
- `smoke.spec.ts`

## Parent

[Matchoji](../README.md)
