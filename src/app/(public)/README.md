# (public)

## Purpose

The public route group, all readable without signing in: the home page (`page.tsx`: hero,
search, category circles and shelves), Explore (`explore/`: the filtered list, filters in
the URL as `?q=&category=&region=&grade=&rating=&sort=`), the regions page (`regions/`:
every region with its tea counts, each linking to Explore, and `regions/supply/` with the
official harvest figures), product pages, the journal and `sell/` (vendor applications and listings), `account/` (your name, data and account deletion) and `admin/` (the review queue, admins
only).
Every page sets its own title. `not-found.tsx` answers an unknown or hidden tea (and any
`notFound()` here) inside the shell. `error.tsx` catches a failed read inside the layout, so the navbar stays and the visitor
can retry or go to Explore. Every page reads Supabase directly; there is no mock fallback.

## Contents

- `account/`
- `admin/`
- `error.tsx`
- `layout.tsx`
- `loading.tsx`
- `not-found.tsx`
- `page.tsx`
- `explore/`
- `journal/`
- `products/`
- `regions/`
- `sell/`

## Connectivity

Home's shelves and circles link into `explore/` and `products/[id]`; every page shares
`layout.tsx`'s navbar/footer shell, whose providers include the sign-in prompt that any
write opens for signed-out visitors.

## Parent

[app](../README.md)
