# api

## Purpose

Supabase reads and writes for the journal: the signed-in user's own tastings (`listMyReviews`) and their want-to-try list (`wishlist-service`). Both look up products through `selectIn`, in
batches, however long the list grows, and read each tea's `status` so a tea awaiting review
or no longer in the catalogue is labelled rather than dropped (the database keeps a rejected
tea readable to anyone who tasted or saved it).

`listWishlist` returns each saved tea's stash (how many you have, when you opened one) and
`setStash` saves it.

## Contents

- `index.ts`
- `journal-service.test.ts`
- `journal-service.ts`
- `wishlist-service.test.ts`
- `wishlist-service.ts`

## Parent

[journal](../README.md)
