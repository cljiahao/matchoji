# app

## Purpose

Next.js App Router tree — pages, layouts, and API route handlers.

## Contents

- `(public)/`
- `api/`
- `auth/`
- `error.tsx`
- `globals.css`
- `layout.tsx`

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
