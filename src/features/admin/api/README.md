# api

## Purpose

`isAdmin` (the `is_admin()` function), `listReviewQueue` (pending teas with who added them,
pending shops, oldest first), `listApprovedTeas`, and the actions `reviewTea`, `mergeTea`,
`reviewShop`, `setTeaLinks` and `uploadTeaImage` (the admin-only `product-images` bucket).
Tested against the recording fake client, whose `rpc` calls are queued as `rpc:<name>`.

## Contents

- `admin-service.test.ts`
- `admin-service.ts`
- `index.ts`

## Parent

[admin](../README.md)
