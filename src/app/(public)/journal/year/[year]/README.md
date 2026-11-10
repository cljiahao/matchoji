# [year]

## Purpose

The signed-in owner's year in tea at `/journal/year/<year>`: totals, first and latest tasting, highest rated, busiest month, newest maker and how their taste moved. A signed-out visitor is asked to sign in; a year with fewer than 3 tastings, or a malformed year, 404s. A public profile gets a Share button (Web Share, else copy link) that shares `/u/<id>/year/<year>`; a private profile is pointed to its account settings instead. The page is not indexed, and a 404 render gets the not-found tab title via `generateMetadata`.

## Contents

- `page.test.tsx`
- `page.tsx`

## Parent

[year](../README.md)
