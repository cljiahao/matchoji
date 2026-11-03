# api

## Purpose

App Router API route handlers. Every handler here is wrapped in `withLogging()` (see `src/lib/utils/with-logging.ts`) — enforced by `scripts/check-route-logging.mjs`.

## Contents

- `health/`
- `label-scan/`

## Connectivity

Each subfolder is one API route, matching Next.js's file-based routing; `health/` is what the Dockerfile's `HEALTHCHECK` probes; it checks the database too. `label-scan/` reads tea labels from photos and stays off (503) until `ANTHROPIC_API_KEY` is set.

## Parent

[app](../README.md)
