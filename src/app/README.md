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
`layout.tsx`, `globals.css`, and `error.tsx` form the shared root shell (fonts, theme,
providers, global error boundary) every route renders inside.

## Parent

[src](../README.md)
