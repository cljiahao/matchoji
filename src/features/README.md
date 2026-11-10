# features

## Purpose

Self-contained feature modules, each with its own `api/`, `components/`, `hooks/`,
`schemas/`, and `types.ts`.

## Contents

- `account/`
- `admin/`
- `auth/`
- `cafes/`
- `discovery/`
- `journal/`
- `label-scan/`
- `learn/`
- `marketplace/`
- `offline/`
- `pairing/`
- `products/`
- `share/`
- `reviews/`
- `shops/`
- `social/`
- `stock/`
- `supply/`
- `taste/`

## Connectivity

`products`, `auth` and `supply` have no dependency on other features. `reviews` depends on `products`
(through its public `index.ts`, for product search/creation) and `auth` (for the current
session). `stock` depends on `auth` only; `marketplace` and `admin` depend on `products`; `taste` depends on `products` and
`reviews`; `social` depends on `products`, `reviews` and `taste`. `label-scan` depends on `products` and `auth`; `reviews` depends on it for the scan button. `journal` depends on `reviews` (row mapping, vocabulary, prep display), `products`
and `auth`. `learn` depends on `products` (category styles, Explore links) and `reviews` (prep methods and the tasting dialog). Imports always go through a feature's `index.ts` and only point that way; where
`products` needs another feature's control on a card it takes a render slot instead.

`pairing` depends on `products` (the category type) and is used by the tea page. `offline` depends on nothing; the root layout and `app/offline` use it.

`cafes` depends on `reviews` (review rows and the one `drinkHref`) and `products` (score numeral, category styles); `share` depends on it for café and drink metadata and images, and the `/cafes` pages and the sitemap use it.

`discovery` depends on `products` and `taste`; the tea page, `/top`, home and the sitemap use it.
`share` depends on `products` and `social`, and is used by the root metadata, manifest and icon routes.

## Parent

[src](../README.md)
