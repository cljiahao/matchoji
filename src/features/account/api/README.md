# api

## Purpose

`getMyProfile` (including whether the profile is public), `updateDisplayName` (the only profile column a user may change),
`exportMyData` (profile, tastings, want-to-try, stock reports, shop) and `deleteMyAccount`
(photos first, then the database function, then sign-out; it stops before deleting anything if
the photos cannot be listed).

## Contents

- `account-service.test.ts`
- `account-service.ts`
- `index.ts`

## Parent

[account](../README.md)
