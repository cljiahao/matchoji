# lib

## Purpose

Pure helpers for review display and the sign-in drafts: a rating (`review-draft`) or a new
product (`product-draft`) parked in sessionStorage across the OAuth redirect, both built on
`session-draft`, which schema-checks what it reads back, kept separate so they are unit-tested
without rendering.

## Contents

- `index.ts`
- `product-draft.test.ts`
- `product-draft.ts`
- `review-draft.test.ts`
- `review-draft.ts`
- `session-draft.ts`
- `truncate-notes.test.ts`
- `truncate-notes.ts`

## Parent

[reviews](../README.md)
