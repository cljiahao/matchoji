# lib

## Purpose

Shared, cross-cutting utilities: constants, error handling, logging, and small helpers.

## Contents

- `constants/`
- `errors/`
- `logger.ts`
- `utils/`

## Connectivity

`constants/` and `utils/` are consumed throughout `src/`. `errors/` standardizes API error responses on top of `src/integrations/error.ts`'s `APIError` type. `logger.ts` is the single pino instance that `errors/error-log-handler.ts` and `utils/with-logging.ts` both write through.

## Parent

[src](../README.md)
