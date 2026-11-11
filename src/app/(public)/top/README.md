# top

## Purpose

The drink top-lists index (`page.tsx`): per city, a preview of each list that has a qualifying drink, or a short note that lists appear once a drink has a taster review or three community reviews, plus an "At home" link to the tea lists. With no lists the page is `noindex`. `[slug]/` is one drink list (an unknown tea-looking slug is a 308 to `teas/<slug>`); `teas/` holds the tea lists.

The empty state offers `AddCafeCta`.

`[slug]/` pages through its list, 20 drinks a page with `?page=`, so the "See all N" on the index matches the list; a page past the last is a 404. The index counts come from the `drink_ranks` view, so the migration `20261112000000_cafe_read_perf.sql` must be applied before the deploy.

## Contents

- `[slug]/`
- `teas/`
- `page.tsx`

## Parent

[(public)](../README.md)
