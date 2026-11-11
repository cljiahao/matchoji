# admin

## Purpose

The review queue that replaces hand-written SQL (M1 of the 2026-10-24 roadmap): admins
approve or reject teas tasters added and shops that applied, with a reason the submitter
sees, merge a duplicate tea into the one it repeats, and set a catalogue tea's photo and shop
link, and resolve reported reviews and comments (remove or keep, with the reason the reporter
is told). Every write is a database function that checks `profiles.is_admin`, so the page's own
check is a convenience, not the guard. The links form starts from the tea's saved credit and shop link, so editing one leaves the other as it was. The page is tabs (Review queue, Reports, Tea photo, Tea price) and the photo form shows the tea's current photo and credit.

The Shops tab lists and edits `shop_locations` through the `shops` feature's public API.

The Cafés and Drinks tabs hold the café-drinks moderation: pending suggestions (read from the
`admin_cafes` and `admin_drinks` views, which add the adder's name; the base tables hide who added
a row and the review note) with approve, reject-with-note and merge into an approved duplicate,
plus a form to edit an approved café's or drink's details. The Tasters tab searches
`public_profiles` by display name (it lists private profiles too) and grants or revokes
`is_trusted_taster` through `set_trusted_taster`. Every write is an audited admin-only database
function; `schemas.ts` Zod-checks the ids, notes and edit fields before they are sent, and a
missing café table makes the lists empty rather than an error. The reports queue also names the
café and drink of a reported drink review.

## Contents

- `api/`
- `components/`
- `index.ts`
- `schemas.ts`
- `types.ts` — row shapes for the admin lists (a profile carries its Instagram handle for taster search)

## Connectivity

Depends on `products` for `ProductSummary`. Nothing depends on it; `/admin` is its only page.

## Parent

[features](../README.md)
