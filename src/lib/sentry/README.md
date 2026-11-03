# sentry

## Purpose

Shared setup for Sentry error tracking, which stays off unless a DSN is set. `initSentry` calls
`Sentry.init` only when given a DSN (10% trace sampling, no replay, `beforeSend` scrubbing) and is
used by `src/instrumentation.ts` and `src/instrumentation-client.ts`. `scrubEvent` removes the user,
cookies, auth headers, request bodies, emails and Supabase JWTs from an event before it leaves.
`captureClientError` reports an error from a client error boundary, loading the SDK lazily and only
with a public DSN. Each file has a test beside it.

## Contents

- `capture.test.ts`
- `capture.ts`
- `init.test.ts`
- `init.ts`
- `scrub.test.ts`
- `scrub.ts`

## Parent

[lib](../README.md)
