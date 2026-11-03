# (public)

## Purpose

The public route group, all readable without signing in: the home page (`page.tsx`: hero,
search, category circles and shelves), Explore (`explore/`: the filtered list, filters in
the URL as `?q=&category=&region=&grade=&rating=&sort=`), the regions page (`regions/`:
every region with its tea counts, each linking to Explore, and `regions/supply/` with the
official harvest figures), `learn/` (recipes and guides), product pages, the journal and `sell/` (vendor applications and listings), `account/` (your name, data and account deletion) and `admin/` (the review queue, admins
only).
Every page sets its own title. `not-found.tsx` answers an unknown or hidden tea (and any
`notFound()` here) inside the shell. `error.tsx` catches a failed read inside the layout, so the navbar stays and the visitor
can retry or go to Explore. Every page reads Supabase directly; there is no mock fallback. Its `loading.tsx` skeleton is announced as a busy `status`.

The layout renders its pages inside `SiteShell`, whose `main` is the skip link's target.

Home titles a shelf "Matcha to try" / "Hojicha to try" while none of its teas is rated, rather than "Top-rated".

`top/` holds the top-lists index and `top/[slug]/` one list ("Top matcha", "Best value hojicha", "Top from Uji"); a list below its threshold (5 teas with 3 ratings each) is absent from the index and the sitemap and its page is `notFound()`. Home's matcha and hojicha shelves send "See all" to their top list once it exists.

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
- `learn/`
- `products/`
- `regions/`
- `sell/`
- `top/`
- `u/`

## Connectivity

Home's shelves and circles link into `explore/` and `products/[id]`; every page shares
`layout.tsx`'s navbar/footer shell, whose providers include the sign-in prompt that any
write opens for signed-out visitors.

## Parent

[app](../README.md)
