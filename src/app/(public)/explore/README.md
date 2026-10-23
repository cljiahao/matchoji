# explore

## Purpose

`/explore`: every tea, filtered by the URL (`?q=&category=&region=&grade=&rating=&sort=`). A
filter rail of links (tea, minimum rating, grade, region), folded behind a "Filters" button on
phones; a search pill that keeps the other filters, a sort select, and wide result rows. Grade
options are the grades of the teas the other filters leave. A search, region, grade or rating
that matches nothing shows a no-match message with a clear-filters link; an empty catalogue
invites the first tasting. Products and regions come from Supabase; a failed region read only
hides the region filter.

Results come 24 per page from `catalogue_teas`, filtered and sorted in SQL, with "Showing
1–24 of N" and Previous/Next links (`?page=`); any other filter change returns to page 1. Signed-in tasters see a match badge on each
row, and "Best match for you" ranks up to 500 matching teas by their score, paging in memory.

## Contents

- `loading.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
