# integrations

## Purpose

External-service client infrastructure — base HTTP client classes, shared error type, and the factory pattern for constructing concrete clients.

## Contents

- `clients/`
- `error.ts`
- `factories.ts`

## Connectivity

`clients/` holds transport-level base classes; `factories.ts` documents the pattern for wiring a concrete client (env config → client instance) on top of them; `error.ts` defines the `APIError` type both `clients/` and `src/lib/errors/` depend on.

## Parent

[src](../README.md)
