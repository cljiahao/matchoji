# features

## Purpose

Self-contained feature modules, each with its own `api/`, `components/`, `hooks/`,
`schemas/`, and `types.ts`.

## Contents

- `auth/`
- `products/`
- `reviews/`

## Connectivity

`products` and `auth` have no dependency on other features. `reviews` depends on `products`
(through its public `index.ts`, for product search/creation) and `auth` (for the current
session) — the only cross-feature imports in this layer, and always one-directional.

## Parent

[src](../README.md)
