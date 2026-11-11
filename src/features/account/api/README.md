# api

## Purpose

`getMyProfile` (including whether the profile is public), `updateDisplayName` (the only profile column a user may change),
`exportMyData` (profile, tastings, want-to-try, stock reports, shop) and `deleteMyAccount`
(photos first, then the database function, then sign-out; it stops before deleting anything if
the photos cannot be listed).

`exportMyData` also returns `cafesAdded` and `drinksAdded`, read from the `my_cafes` and `my_drinks` views (the only way to read `added_by` and `review_note`); a missing view gives an empty list.

`updateProfileDetails` writes the Instagram handle and bio after `profileDetailsSchema` has checked them (a blank value is stored as null); `getMyProfile` also returns both.

`exportMyData` now also returns `likes`, `comments`, `following`, `blocked`, `lessonProgress`, `reportsFiled`, `notifications` and `labelScans`, so the file holds every row the person owns. `deleteMyAccount` now reads the photo list, runs the delete function first, then removes the files best effort and signs out; a failed delete leaves the photos alone, and it returns `photosRemoved` (false when the cleanup failed after the account was gone).

## Contents

- `account-service.test.ts`
- `account-service.ts`
- `index.ts`

`exportMyData` names the notification columns instead of selecting `*`, so `actor_id` (another person's id) is not in the export.

## Parent

[account](../README.md)
