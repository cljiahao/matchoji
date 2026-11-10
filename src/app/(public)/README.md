# (public)

## Purpose

The public route group, all readable without signing in: the home page (`(home)/page.tsx`: the café-first hero with `CitySwitch`, then sections that each hide when empty: latest taster reviews, the city's top hojicha lattes, cafés by area, who you follow, and always "Brew it at home"), Explore (`explore/`: the filtered list, filters in
the URL as `?q=&category=&region=&grade=&rating=&sort=`), the regions page (`regions/`:
every region with its tea counts, each linking to Explore, and `regions/supply/` with the
official harvest figures), `learn/` (recipes and guides), product pages, the journal and `sell/` (vendor applications and listings), `account/` (your name, data and account deletion) and `admin/` (the review queue, admins
only).
Every page sets its own title. `not-found.tsx` answers an unknown or hidden tea (and any
`notFound()` here) inside the shell. `error.tsx` catches a failed read inside the layout, so the navbar stays and the visitor
can retry or go to Explore. Every page reads Supabase directly; there is no mock fallback. Skeletons live in `(home)/loading.tsx` and the list routes only, never above a page that redirects or calls `notFound()`: a streamed response has already sent its 200.

The layout renders its pages inside `SiteShell`, whose `main` is the skip link's target.

The "Log a drink" buttons on the home page, Explore and the journal open `LogDialog`, which asks whether it was a café drink or a tea.

`cafes/` holds the café list, café pages and drink pages (see its README).

`top/` holds the drink top-lists index (per city, base and style) and `top/[slug]/` one drink list (`singapore-hojicha-latte`); tea lists live under `top/teas/`, and an old `/top/<tea-slug>` is a 308 to `/top/teas/<slug>`. The "No drinks rated yet" panel shows whenever no café rail (taster reviews, top lattes, areas, feed) renders. Home reads `?city=` through `resolveCity`, else the city cookie, else Singapore.

`tasters/` lists the trusted tasters (one quiet line when there are none) and `about/how-we-rate/` explains the taster and community scores and the disclosure labels in plain words.

## Contents

- `about/`
- `account/`
- `admin/`
- `cafes/`
- `error.tsx`
- `explore/`
- `(home)/`
- `journal/`
- `layout.tsx`
- `learn/`
- `not-found.tsx`
- `products/`
- `regions/`
- `sell/`
- `tasters/`
- `top/`
- `u/`

## Connectivity

Home links into `cafes/`, `top/` and `explore/`; every page shares
`layout.tsx`'s navbar/footer shell, whose providers include the sign-in prompt that any
write opens for signed-out visitors.

## Parent

[app](../README.md)
