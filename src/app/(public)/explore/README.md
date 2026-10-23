# explore

## Purpose

`/explore`: every tea, filtered by the URL (`?q=&category=&region=&grade=&rating=&sort=`). A
filter rail of links (tea, minimum rating, grade, region), folded behind a "Filters" button on
phones; a search pill that keeps the other filters, a sort select, and wide result rows. Grade
options are the grades of the teas the other filters leave. A search, region, grade or rating
that matches nothing shows a no-match message with a clear-filters link; an empty catalogue
invites the first tasting. Products and regions come from Supabase; a failed region read only
hides the region filter.

## Contents

- `loading.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
