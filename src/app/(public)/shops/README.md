# shops

## Purpose

`/shops`: "Tea shops" (where to buy in person). A map of real shop locations (a maker's own stores, stockists, cafés) with a filterable list below it (maker, kind, country); `?brand=<maker>` preselects a maker, and a maker no shop has is ignored. Each card shows its address, a Directions link (an OpenStreetMap search built from the address, no API) and a Source link to the page the address came from. Rendered per request. With no rows, or before the `shop_locations` migration is applied, it says no shops are listed.

Its `loading.tsx` skeleton is announced as a busy `status`.

The page has its own meta description.

## Contents

- `loading.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
