# explore

## Purpose

`/explore`: every tea, filtered by the URL (`?q=&category=&region=&grade=&rating=&sort=`). A
filter rail of links (tea, minimum rating, grade, region), folded behind a "Filters" button on
phones; a search pill that keeps the other filters, a sort select, and wide result rows. Grade
options are the grades of the teas the other filters leave. A search, region, grade or rating
that matches nothing shows a no-match message with a clear-filters link; an empty catalogue
invites the first tasting. Products and regions come from Supabase; a failed region read only
hides the region filter.

Results show 12 teas at first from `catalogue_teas`, filtered and sorted in SQL, with "Showing
X of N teas" and a "Show more" link that adds 12 (`?shown=24`, a plain server-rendered link, so
Back and shared links restore the list); any filter or sort change returns to 12, and an old
`?page=` is ignored. Signed-in tasters see a match badge on each row, and "Best match for you"
ranks up to 500 matching teas by their score, trimming to the shown count in memory. Its `loading.tsx` skeleton is announced as a busy `status`.

## Contents

- `loading.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
