# (public)

## Purpose

The public route group — the discover feed (home) and product detail pages, all readable
without signing in. The feed reads its filters from the URL (`?q=&category=&region=&sort=`). The feed has two "Log a tasting" dialogs (header and empty state);
only the header one reopens a new product parked across Google sign-in.

## Contents

- `layout.tsx`
- `loading.tsx`
- `page.tsx`
- `journal/`
- `products/`

## Connectivity

`page.tsx` is the discover feed; `products/[id]` is one product's detail page. Both share
`layout.tsx`'s navbar/footer shell.

## Parent

[app](../README.md)
