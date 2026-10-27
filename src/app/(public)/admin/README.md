# admin

## Purpose

`/admin`, the review queue. It 404s for visitors and for anyone whose profile is not flagged
`is_admin` (set once by hand in SQL), and is excluded from search engines; only admins see its "Review queue" title. Rendered per
request.

It lists teas and shops to review and open reports, and has forms for a tea's photo and shop
link and its reference price.

## Contents

- `page.tsx`

## Parent

[(public)](../README.md)
