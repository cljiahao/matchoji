# api

## Purpose

`isAdmin` (the `is_admin()` function), `listReviewQueue` (pending teas with who added them,
pending shops, oldest first), `listApprovedTeas`, and the actions `reviewTea`, `mergeTea`,
`reviewShop`, `setTeaLinks` `uploadTeaImage` (the admin-only `product-images` bucket), `listOpenReports` (each with the
reported text and who wrote it) and `resolveReport`, plus `setTeaPrice` (a tea's reference price,
or null to clear it).
The café-drinks additions: `listCafeQueue` and `listDrinkQueue` (pending rows from `admin_cafes` and
`admin_drinks`, with the adder), `listApprovedCafes` and `listApprovedDrinks` (merge targets and edit
pickers), `reviewCafe`, `reviewDrink`, `mergeCafe`, `mergeDrink`, `updateCafe`, `updateDrink`
(allow-listed fields, Zod-checked first), `searchProfiles` and `listTrustedTasters` (from
`public_profiles`, which includes private profiles) and `setTrustedTaster`. The lists return `[]` on a
missing table (`42P01`, `PGRST205`); the actions throw the database's error unchanged.
`listOpenReports` labels a drink review with its café and drink. Never `select('*')` from `cafes` or
`drinks`: the base tables deny the adder and review note to clients.
Tested against the recording fake client, whose `rpc` calls are queued as `rpc:<name>`.

`listApprovedTeas` also returns each tea's `imageUrl`, `imageCredit` and `shopUrl`; the links form prefills the last two and shows the photo. `setTeaLinks` takes `image` (null keeps the current photo, `''` removes it and its credit), `shop` and `credit`.

The café and drink lists take `{ search, limit }` (name search; default limit 200) so the pickers are not unbounded, and a failing café lookup for a drink list is thrown instead of returning an empty list; only a genuinely missing table or view is treated as empty. `searchProfiles` matches display name or Instagram handle (a leading @ is ignored).

## Contents

- `admin-service.test.ts`
- `admin-service.ts`
- `index.ts`

## Parent

[admin](../README.md)
