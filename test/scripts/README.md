# scripts

## Purpose

Tests for the standalone scripts in `scripts/`. `schema-check.test.ts` covers `schema-check.ts` with mocked query results and generated-style type files: the migration drift diff, the skip when `SUPABASE_DB_URL` is unset, and the types comparison. The first `extractShape` test pays the one-time TypeScript lib parse; later ones reuse it, so none needs a custom timeout.

## Contents

- `schema-check.test.ts`

## Parent

[test](../README.md)
