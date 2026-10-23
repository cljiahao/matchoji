# support

## Purpose

Shared test infrastructure. `setup.ts` registers jest-dom matchers, RTL cleanup, and the
jsdom polyfills Radix needs. `fake-supabase.ts` is a recording PostgREST-shaped client (a queued result may be a Promise, so a test can
observe state while a request is in flight);
`fake-browser-client.ts` adds steerable auth and storage on top for component tests;
`render.tsx` wraps renders in a fresh TanStack Query client and provides `makeProduct` /
`makeReview` fixtures (`makeProduct` has no supply level unless a test sets one).

## Contents

- `fake-browser-client.ts`
- `fake-supabase.ts`
- `render.tsx`
- `setup.ts`

## Parent

[test](../README.md)
