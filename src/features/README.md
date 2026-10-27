# features

## Purpose

Self-contained feature modules, each with its own `api/`, `components/`, `hooks/`,
`schemas/`, and `types.ts`.

## Contents

- `account/`
- `admin/`
- `auth/`
- `journal/`
- `learn/`
- `marketplace/`
- `products/`
- `reviews/`
- `social/`
- `stock/`
- `supply/`
- `taste/`

## Connectivity

`products`, `auth` and `supply` have no dependency on other features. `reviews` depends on `products`
(through its public `index.ts`, for product search/creation) and `auth` (for the current
session). `stock` depends on `auth` only; `marketplace` and `admin` depend on `products`; `taste` depends on `products` and
`reviews`; `social` depends on `products`, `reviews` and `taste`. `journal` depends on `reviews` (row mapping, vocabulary, prep display), `products`
and `auth`. `learn` depends on `products` (category styles, Explore links) and `reviews` (prep methods and the tasting dialog). Imports always go through a feature's `index.ts` and only point that way; where
`products` needs another feature's control on a card it takes a render slot instead.

## Parent

[src](../README.md)
