# api

## Purpose

`isAdmin` (the `is_admin()` function), `listReviewQueue` (pending teas with who added them,
pending shops, oldest first), `listApprovedTeas`, and the actions `reviewTea`, `mergeTea`,
`reviewShop`, `setTeaLinks` `uploadTeaImage` (the admin-only `product-images` bucket), `listOpenReports` (each with the
reported text and who wrote it) and `resolveReport`, plus `setTeaPrice` (a tea's reference price,
or null to clear it).
Tested against the recording fake client, whose `rpc` calls are queued as `rpc:<name>`.

`listApprovedTeas` also returns each tea's `imageUrl`, `imageCredit` and `shopUrl`; the links form prefills the last two and shows the photo. `setTeaLinks` takes `image` (null keeps the current photo, `''` removes it and its credit), `shop` and `credit`.

## Contents

- `admin-service.test.ts`
- `admin-service.ts`
- `index.ts`

## Parent

[admin](../README.md)
