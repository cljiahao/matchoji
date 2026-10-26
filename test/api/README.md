# api

## Purpose

Tests for the App Router API route handlers in `src/app/api/`. `health.test.ts` covers a
healthy database (200), a database error and missing Supabase settings (both 503);
`with-logging.test.ts` also checks a malformed `x-request-id` is replaced.

## Contents

- `health.test.ts`
- `with-logging.test.ts`

## Parent

[test](../README.md)
