# lib

## Purpose

Shared, cross-cutting utilities: constants, error handling, logging, and small helpers.

## Contents

- `constants/`
- `errors/`
- `logger.ts`
- `security/`
- `utils/`

## Connectivity

`constants/` and `utils/` are consumed throughout `src/`. `errors/` standardizes API error responses on top of `src/integrations/error.ts`'s `APIError` type. `security/csp.ts` builds the Content-Security-Policy (nonce-based `script-src`, image sources) that `src/proxy.ts` sets on each request. `logger.ts` is the single pino instance that `errors/error-log-handler.ts` and `utils/with-logging.ts` both write through.

## Parent

[src](../README.md)
