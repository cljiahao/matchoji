# (public)

## Purpose

The public route group, all readable without signing in: the home page (`page.tsx`: hero,
search, category circles and shelves), Explore (`explore/`: the filtered list, filters in
the URL as `?q=&category=&region=&sort=`), product pages and the journal.

## Contents

- `layout.tsx`
- `loading.tsx`
- `page.tsx`
- `explore/`
- `journal/`
- `products/`

## Connectivity

Home's shelves and circles link into `explore/` and `products/[id]`; every page shares
`layout.tsx`'s navbar/footer shell, whose providers include the sign-in prompt that any
write opens for signed-out visitors.

## Parent

[app](../README.md)
