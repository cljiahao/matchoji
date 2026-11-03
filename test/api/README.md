# api

## Purpose

Tests for the App Router API route handlers in `src/app/api/`. `health.test.ts` covers a
healthy database (200), a database error and missing Supabase settings (both 503);
`label-scan.test.ts` covers the label route: 401 signed out, 503 without a key, 400 for bad files, 429 at the daily limit, 422 for an unreadable label and 200 with a mocked Claude SDK; `with-logging.test.ts` also checks a malformed `x-request-id` is replaced.

## Contents

- `health.test.ts`
- `label-scan.test.ts`
- `with-logging.test.ts`

## Parent

[test](../README.md)
