# (list)

## Purpose

A route group with no URL segment: the café list page and its skeleton. It keeps `loading.tsx` off `[slug]/`, whose merged-café redirect and `notFound()` need a real 308 or 404 rather than a streamed 200.

`generateMetadata` gives each city's list a self-referencing canonical `/cafes?city=<city>` (filters fold into it) and marks it `noindex` while the city has no café. An empty city shows the add-café call to action (`AddCafeCta`): "Add a café" when signed in, "Sign in to add a café" when not; a filter that matches nothing does not.

## Contents

- `loading.tsx`
- `page.test.tsx`
- `page.tsx`

## Parent

[cafes](../README.md)
