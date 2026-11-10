# app

## Purpose

Next.js App Router tree — pages, layouts, and API route handlers. `globals.css` holds the
theme tokens and the few global rules (focus outline, pill buttons, number and date fields).
`layout.tsx` sets the metadata base (`SITE_URL`) and the "%s · Matchoji" title template, and passes the request's CSP nonce to the theme script (which also makes every page render per request);
`not-found.tsx` covers URLs outside every route (inside `SiteShell`, with the title "Page not found"); `sitemap.ts` lists the browse pages, `/top`, `/top/teas`, each drink list and tea list that exists, the Learn courses, lessons, recipes and guides, and
catalogue teas (read per request) and `robots.ts` keeps admin, account, journal, sell and auth pages
out of search engines. Theme tokens meet WCAG AA, which `globals.test.ts` checks (field edges 3:1, muted, brand and category text 4.5:1 in both themes); the dark block is opt-in through the footer's theme toggle, with Light the default and `enableSystem` on; `error.tsx` and `auth/error/` render a `main` landmark with one h1.

Sharing and install: `opengraph-image.tsx` is the site-wide link preview (the tea and profile pages have their own), `manifest.ts` makes the site installable as a standalone app (name, `/` start URL, brand-green theme, white background) and `icons/` serves its icons; `layout.tsx` adds the Apple web-app tags, icon links and a light/dark `themeColor`. `offline/` is the page the service worker (`public/sw.js`, see `features/offline`) precaches and shows when a page can't be loaded; `layout.tsx` registers the worker in production.

`sitemap.ts` also lists `/shops`, `/cafes` and every approved café and drink page (read per request), and lists `/sell` only while `MARKETPLACE_ENABLED` is on.

`layout.tsx` also sets `alternates.canonical` to `./`, which Next resolves against each page's own path, so filters and tracking parameters fold into the plain URL; `robots.ts` also keeps `/api/` out. A performance and SEO pass is recorded in `docs/superpowers/specs/2026-11-04-performance-pass.md`.

`sitemap.ts` also lists `/tasters` and `/about/how-we-rate`.

The root layout, web manifest and share image take their description and alt text from `SITE_DESCRIPTION` / `SITE_TAGLINE` (`lib/constants/site.ts`), so they state the café-drink positioning. `sitemap.ts` lists each city's home (`/?city=`) and, only when the city has a café, its list (`/cafes?city=`), and leaves out `/top` and `/tasters` while they are empty, matching their `noindex`. The root not-found page links to cafés first.

## Contents

- `(public)/`
- `api/`
- `auth/`
- `c/`
- `error.tsx`
- `error-pages.test.tsx`
- `global-error.test.tsx`
- `global-error.tsx`
- `globals.css`
- `icons/`
- `layout.tsx`
- `manifest.test.ts`
- `manifest.ts`
- `offline/`
- `not-found.test.tsx`
- `not-found.tsx`
- `opengraph-image.tsx`
- `robots.ts`
- `sitemap.test.ts`
- `sitemap.ts`

## Connectivity

`(public)/` is the route group for the app's pages; a `loading.tsx` never sits above a page that redirects or calls `notFound()` (see `test/app/loading-boundaries.test.ts`), so `error-pages.test.tsx` imports the home skeleton from `(public)/(home)/`; `api/` holds server route handlers;
`auth/` holds the OAuth callback and its error page (not a route group — no shared layout).
`globals.css` holds the design tokens (white ground, warm grey tiles, matcha-green brand,
category colours), the pill-button rule (dark-mode values keep the green actions), and the authored motion (`.bar-grow`, `.marker-slide`), plus the global `:focus-visible` outline (kept outside
any `@layer` so utilities can't hide it) and themed number/date inputs and summaries.
`error.tsx` and `global-error.tsx` (which replaces the root layout when it fails) log the error and report it to Sentry when a DSN is set.
`layout.tsx`, `globals.css`, and `error.tsx` form the shared root shell (fonts, theme,
providers, global error boundary) every route renders inside.

## Parent

[src](../README.md)
