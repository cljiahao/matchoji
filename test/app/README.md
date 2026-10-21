# app

## Purpose

Route-level tests for `src/app/`: the discover and product pages (rendered as async
Server Components against a fake Supabase client, including the product page's score and
crowd summary built from tasting fields), loading and error routes, and the
OAuth callback's redirect handling, including Discover's filter and no-results states.

## Contents

- `auth-callback.test.ts`
- `pages.test.tsx`

## Parent

[test](../README.md)
