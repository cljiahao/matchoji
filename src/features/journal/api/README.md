# api

## Purpose

Supabase reads and writes for the journal: one taster's tastings (`listUserTastings`, also exported as `listMyReviews` for the signed-in reader; each carries its tea's region name, read in a second batched lookup) and `getPublicYear`, a public taster's recap for the share page and card (null for a private or unknown taster or a thin year); `isProfilePublic` says whether the owner may share and their want-to-try list (`wishlist-service`). Both look up products through `selectIn`, in
batches, however long the list grows, and read each tea's `status` so a tea awaiting review
or no longer in the catalogue is labelled rather than dropped (the database keeps a rejected
tea readable to anyone who tasted or saved it).

`listWishlist` returns each saved tea's stash (how many you have, when you opened one) and
`setStash` saves it; `getStash` reads one tea's stash for the tea page.

## Contents

- `index.ts`
- `journal-service.test.ts`
- `journal-service.ts`
- `wishlist-service.test.ts`
- `wishlist-service.ts`

## Parent

[journal](../README.md)
