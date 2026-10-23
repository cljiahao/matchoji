# api

## Purpose

Supabase reads and writes for the journal: the signed-in user's own tastings (`listMyReviews`) and their want-to-try list (`wishlist-service`). Both look up products through `selectIn`, in
batches, however long the list grows.

## Contents

- `index.ts`
- `journal-service.test.ts`
- `journal-service.ts`
- `wishlist-service.test.ts`
- `wishlist-service.ts`

## Parent

[journal](../README.md)
