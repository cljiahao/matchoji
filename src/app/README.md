# app

## Purpose

Next.js App Router tree — pages, layouts, and API route handlers. `globals.css` holds the
theme tokens and the few global rules (focus outline, pill buttons, number and date fields).
`layout.tsx` sets the metadata base (`SITE_URL`) and the "%s · Matchoji" title template, and passes the request's CSP nonce to the theme script (which also makes every page render per request);
`not-found.tsx` covers URLs outside every route; `sitemap.ts` lists the browse pages, the Learn courses, lessons, recipes and guides, and
catalogue teas (read per request) and `robots.ts` keeps admin, account, journal, sell and auth pages
out of search engines. Theme tokens meet WCAG AA, which `globals.test.ts` checks (field edges 3:1, muted and brand text 4.5:1 in both themes); `error.tsx` and `auth/error/` render a `main` landmark with one h1.

## Contents

- `(public)/`
- `api/`
- `auth/`
- `error.tsx`
- `globals.css`
- `layout.tsx`
- `not-found.tsx`
- `robots.ts`
- `sitemap.ts`

## Connectivity

`(public)/` is the route group for the app's pages; `api/` holds server route handlers;
`auth/` holds the OAuth callback and its error page (not a route group — no shared layout).
`globals.css` holds the design tokens (white ground, warm grey tiles, matcha-green brand,
category colours), the pill-button rule (dark-mode values keep the green actions), and the authored motion (`.bar-grow`, `.marker-slide`), plus the global `:focus-visible` outline (kept outside
any `@layer` so utilities can't hide it) and themed number/date inputs and summaries.
`layout.tsx`, `globals.css`, and `error.tsx` form the shared root shell (fonts, theme,
providers, global error boundary) every route renders inside.

## Parent

[src](../README.md)
