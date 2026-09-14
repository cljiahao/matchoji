# (public)

## Purpose

The public route group — the discover feed (home) and product detail pages, all readable
without signing in.

## Contents

- `layout.tsx`
- `page.tsx`
- `products/`

## Connectivity

`page.tsx` is the discover feed; `products/[id]` is one product's detail page. Both share
`layout.tsx`'s navbar/footer shell.

## Parent

[app](../README.md)
