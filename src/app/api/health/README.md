# health

## Purpose

The `/api/health` route — probed by the Dockerfile's `HEALTHCHECK` and usable by an uptime
monitor. It calls the database's `health()` and answers 200 `ok` or 503 `degraded` (the
database errored) / `down` (Supabase is not configured). `proxy.ts` skips it, so probes do
not refresh sessions.

## Contents

- `route.ts`

## Parent

[api](../README.md)
