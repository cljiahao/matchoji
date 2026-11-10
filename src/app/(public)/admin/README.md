# admin

## Purpose

`/admin`, the review queue. It 404s for visitors and for anyone whose profile is not flagged
`is_admin` (set once by hand in SQL), and is excluded from search engines; only admins see its "Review queue" title. Rendered per
request.

It is eight tabs (review queue, cafés, drinks, tasters, reports, tea photo, tea price, shops), kept in the URL hash. It lists teas, shops, cafés and drinks to review and open reports, has forms for a tea's photo and shop
link and its reference price and for a café's or drink's details, and grants the trusted-taster badge.

A Shops tab manages the `/shops` locations through `ShopsForm`.

## Contents

- `page.test.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
