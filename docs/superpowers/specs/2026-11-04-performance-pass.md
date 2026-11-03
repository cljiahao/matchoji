# Performance and SEO pass, 2026-11-04

## Method

Lighthouse 12 (`npx lighthouse@12 <url> --only-categories=performance,seo,accessibility,best-practices`,
headless Chrome, once per page, mobile preset = simulated Slow 4G / 4x CPU, desktop preset =
`--preset=desktop`) against production, https://matchoji.vercel.app, on 2026-11-03. The tea page
is the first tea Explore lists (`/products/6f5677af-b8cb-45e1-869f-ee8260b467d5`). One run per cell
is noisy: TBT and LCP move by a few hundred ms between runs, so read the scores as bands and trust
the structural findings (bytes, blocking CSS, shifts, missing tags) more than a single number.

Scores are performance / accessibility / best-practices / SEO.

## Before (production, 2026-11-03)

| Page       | Form    | Scores        | FCP ms | LCP ms | TBT ms |   CLS | Transfer KB |
| ---------- | ------- | ------------- | -----: | -----: | -----: | ----: | ----------: |
| `/`        | mobile  | 87/100/96/100 |   1035 |   3876 |    107 | 0.059 |         485 |
| `/`        | desktop | 99/100/96/100 |    343 |    748 |      0 | 0.000 |         488 |
| `/explore` | mobile  | 82/98/96/100  |   1143 |   4101 |    134 | 0.000 |         486 |
| `/explore` | desktop | 98/100/96/100 |    582 |   1003 |      0 | 0.000 |         507 |
| tea page   | mobile  | 81/100/96/92  |   1033 |   4021 |    115 | 0.001 |         479 |
| tea page   | desktop | 92/100/96/92  |    364 |    981 |      0 | 0.105 |         483 |
| `/regions` | mobile  | 75/96/93/100  |   1013 |   5231 |    165 | 0.001 |         566 |
| `/regions` | desktop | 89/96/96/100  |    477 |   1657 |      0 | 0.000 |         763 |
| `/shops`   | mobile  | 51/100/93/100 |   1141 |   3382 |    864 | 0.303 |         606 |
| `/shops`   | desktop | 91/100/96/100 |    409 |   1547 |      3 | 0.000 |         877 |
| `/top`     | mobile  | 74/100/96/100 |   1041 |   3207 |    667 | 0.001 |         473 |
| `/top`     | desktop | 98/100/96/100 |    370 |    772 |      0 | 0.000 |         471 |

## What the audits found

1. **Leaflet's stylesheet was on every page.** `tea-map.tsx` imports `leaflet/dist/leaflet.css`, and
   `@/components/widgets` re-exported `TeaMap`, so any page importing `BackLink` or `UnitInput` (the
   footer, every form, every Learn page) pulled the 13.5 KB map CSS as a render-blocking
   stylesheet. Production's `/`, `/learn` and `/regions` all linked the same `leaflet-pane` CSS
   chunk. The map JS was already loaded lazily (`import('leaflet')` inside an effect); only the CSS
   leaked.
2. **Every page shipped the Log a tasting form.** The navbar and tab bar mount `LogTastingDialog`
   on every page, and it statically imported React Hook Form, the Zod resolver, label scanning, the
   product search and the rating form. Turbopack also kept whole feature barrels (`export *`) in
   the graph, so unused exports rode along. Lighthouse reported 128 to 158 KiB of unused JavaScript
   on every page. The dialog also fired a regions query on every page load for a form nobody had
   opened.
3. **Zod's JIT probe reported a CSP violation on every page.** Zod 4 tries `new Function("")` to
   see if it may compile parsers. The CSP has no `'unsafe-eval'` (and must not), so the browser
   reports `script-src blocked eval` on each page load; Zod catches it and falls back, but it shows
   in the console and in any CSP report. The Playwright suite's CSP check caught it.
4. **Layout shift in the navbar.** While the session resolves, `AuthStatus` drew a 36 px circle and
   then swapped in the much wider "Sign in" button, shifting the whole right-hand group (the CLS
   culprit Lighthouse named on `/regions`, `/shops`, `/top` and the tea page).
5. **`/shops` mobile: 864 ms TBT and CLS 0.303.** Dominated by the same shared bundle plus the
   explorer's list and map initialising together. The shared-bundle cut (item 2) is the fix in
   scope here; the remaining cost is the Leaflet chunk itself on a map page, which is the point of
   the page.
6. **The tea page's SEO 92 is a Lighthouse artefact, not a missing tag.** `generateMetadata` reads
   the database, so Next 16 streams the tag into `<body>` for ordinary browsers, where Lighthouse's
   meta-description audit does not look. The description is present (`curl` shows it, and Next
   serves metadata in `<head>` to known crawlers such as Googlebot). Left alone: forcing blocking
   metadata for all clients would delay first byte on the page that most needs it.
7. **Missing structured data and canonical URLs; thin descriptions.** No page declared a canonical
   URL, no tea page carried JSON-LD, and Explore, Regions, Shops and Supply inherited the
   site-wide description.

Checked and left as they are: the font is one preloaded 20 KB Figtree variable file
(`next/font`, no layout-shift swap); there are no `next/image` uses to tune (tea photos are
remote Supabase Storage URLs, which `next/image` cannot be configured for ahead of time, and
the home and Explore LCP element is the heading text, not an image); the home page's three shelf
queries are already `limit 12` and run in parallel; `robots.ts` and `sitemap.ts` were correct.

Cache headers: every page is `private, no-cache, no-store`. That is deliberate and stays: the CSP
nonce is minted per request in `proxy.ts`, so a page's HTML cannot be shared between visitors, and
the home, tea and Explore pages also carry signed-in personalisation. Static assets under
`/_next/static` already have immutable caching. No `revalidate` was added.

## Changes

- `TeaMap` is no longer re-exported from `@/components/widgets`; the regions page and
  `ShopsExplorer` import it from `@/components/widgets/tea-map`. Leaflet's CSS now loads on
  `/regions` and `/shops` only.
- `LogTastingDialog` keeps the trigger, the open state and the signed-out gate; the form moved to
  `log-tasting-flow.tsx`, loaded with `next/dynamic` the first time the dialog opens. It also stops
  fetching regions on pages where nobody opens the dialog.
- `package.json` declares `"sideEffects": ["*.css"]` so the bundler can drop unused barrel
  re-exports (the project has no side-effect-only module imports apart from CSS).
- `z.config({ jitless: true })` in the client providers: no eval probe, no CSP report.
- `AuthStatus` loads with a skeleton the size of the Sign in button.
- Root metadata sets `alternates.canonical` to `./`, which Next resolves per page; descriptions for
  Explore, Regions, Shops and Supply; `robots.ts` also disallows `/api/`.
- Tea pages (catalogue teas only) emit `Product` JSON-LD, with `aggregateRating` only when the tea
  has at least one rating. The CSP does not need a nonce for a `application/ld+json` data block.

## After

Local production build, uncompressed first-load JavaScript per route (`next build`,
`.next/diagnostics/route-bundle-stats.json`):

| Route            | Before KB | After KB |
| ---------------- | --------: | -------: |
| `/`              |      1260 |     1122 |
| `/explore`       |      1260 |     1148 |
| `/products/[id]` |      1278 |     1223 |
| `/regions`       |      1250 |     1121 |
| `/shops`         |      1254 |     1125 |
| `/learn`         |      1252 |     1119 |
| `/top`           |      1248 |     1119 |

Leaflet's CSS (13.5 KB, render-blocking) is gone from every route except `/regions` and `/shops`.
The Log a tasting form (about 50 KB of rating-form code plus React Hook Form) is now a lazy chunk.

Production Lighthouse scores after the change are recorded below once this has deployed, with the
same command and the same tea:

| Page      | Form | Scores | LCP ms | TBT ms | CLS |
| --------- | ---- | ------ | -----: | -----: | --: |
| _pending_ |      |        |        |        |     |

## Not done, and why

- **Supabase client in the first-load bundle (about 290 KB uncompressed).** The session provider
  needs it on every page. Deferring it means loading it after hydration and reworking the
  components that read the session synchronously; worth its own change.
- **Function region.** Production responses come from `iad1` (`x-vercel-id`) and the database's
  region should be checked against it; a mismatch would add round trips to every dynamic render.
  That is a Vercel project setting, not code.
- **Streaming metadata for the tea page** (item 6) and the pages' per-request rendering, both
  forced by design (nonce CSP, live ratings).
