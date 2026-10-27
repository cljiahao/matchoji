# admin

## Purpose

The review queue that replaces hand-written SQL (M1 of the 2026-10-24 roadmap): admins
approve or reject teas tasters added and shops that applied, with a reason the submitter
sees, merge a duplicate tea into the one it repeats, and set a catalogue tea's photo and shop
link, and resolve reported reviews and comments (remove or keep, with the reason the reporter
is told). Every write is a database function that checks `profiles.is_admin`, so the page's own
check is a convenience, not the guard. The links form starts from the tea's saved credit and shop link, so editing one leaves the other as it was. The page is tabs (Review queue, Reports, Tea photo, Tea price) and the photo form shows the tea's current photo and credit.

## Contents

- `api/`
- `components/`
- `index.ts`
- `types.ts`

## Connectivity

Depends on `products` for `ProductSummary`. Nothing depends on it; `/admin` is its only page.

## Parent

[features](../README.md)
