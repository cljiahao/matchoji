# features

## Purpose

Self-contained feature modules, each with its own `api/`, `components/`, `hooks/`,
`schemas/`, and `types.ts`.

## Contents

- `admin/`
- `auth/`
- `journal/`
- `marketplace/`
- `products/`
- `reviews/`
- `stock/`
- `supply/`

## Connectivity

`products`, `auth` and `supply` have no dependency on other features. `reviews` depends on `products`
(through its public `index.ts`, for product search/creation) and `auth` (for the current
session). `stock` depends on `auth` only; `marketplace` and `admin` depend on `products`. `journal` depends on `reviews` (row mapping, vocabulary, prep display), `products`
and `auth`. Imports always go through a feature's `index.ts` and only point that way; where
`products` needs another feature's control on a card it takes a render slot instead.

## Parent

[src](../README.md)
