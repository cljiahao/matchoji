# api

## Purpose

App Router API route handlers. Every handler here is wrapped in `withLogging()` (see `src/lib/utils/with-logging.ts`) — enforced by `scripts/check-route-logging.mjs`.

## Contents

- `health/`

## Connectivity

Each subfolder is one API route, matching Next.js's file-based routing; `health/` is the only route so far and is what the Dockerfile's `HEALTHCHECK` probes.

## Parent

[app](../README.md)
