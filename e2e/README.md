# e2e

## Purpose

Read-only Playwright smoke tests of the live site, run with `pnpm e2e` against
`E2E_BASE_URL` (production, https://matchoji.vercel.app, by default; Vercel previews are
login-gated). They cover the home shelves, header search into Explore, a tea page (name, rating,
similar teas, `Product` JSON-LD), `/regions` and `/shops` (map container and list), `/top`,
"Log a tasting" asking a signed-out visitor to sign in, the theme toggle going dark, and
`robots.txt` / `sitemap.xml`. They never sign in and never write data. `fixtures.ts` makes every
test also fail on a console error, an uncaught page error or a `securitypolicyviolation`, so the
nonce and `strict-dynamic` policy stays honest. Desktop and mobile (Pixel 7) projects both run; the
header search test is desktop only. Vitest ignores this folder.

## Contents

- `fixtures.ts`
- `smoke.spec.ts`

## Parent

[Matchoji](../README.md)
