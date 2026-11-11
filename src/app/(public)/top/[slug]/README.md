# [slug]

## Purpose

One drink top list, numbered, for a slug such as `singapore-hojicha-latte` (city, base, style). The list is paged, 20 a page (`?page=`, a bad value is page 1), with "Showing a–b of N" and Previous/Next links, so the rows add up to the "See all N" count on `/top`. A known list with no qualifying drink, or a page past the end, is `notFound()`. A slug that is not a drink list but is a tea list today (`findTopList`) is a 308 (`permanentRedirect`) to `/top/teas/<slug>`, so old links keep working; any other slug is `notFound()`, so no permanent redirect is cached for junk.

## Contents

- `page.tsx`

## Parent

[top](../README.md)
