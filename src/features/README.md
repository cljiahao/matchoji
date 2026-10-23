# features

## Purpose

Self-contained feature modules, each with its own `api/`, `components/`, `hooks/`,
`schemas/`, and `types.ts`.

## Contents

- `auth/`
- `journal/`
- `products/`
- `reviews/`
- `supply/`

## Connectivity

`products`, `auth` and `supply` have no dependency on other features. `reviews` depends on `products`
(through its public `index.ts`, for product search/creation) and `auth` (for the current
session). `journal` depends on `reviews` (row mapping, vocabulary, prep display), `products`
and `auth`. Imports always go through a feature's `index.ts` and only point that way; where
`products` needs another feature's control on a card it takes a render slot instead.

## Parent

[src](../README.md)
