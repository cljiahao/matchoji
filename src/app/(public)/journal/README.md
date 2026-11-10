# journal

## Purpose

The `/journal` page: signed-in users see their stats, tastings by month and want-to-try list; signed-out visitors get a short explanation and a button that opens the sign-in dialog. `loading.tsx` mirrors the page's shapes: a 24px stats
panel and 16px rows. The signed-in user comes from the server Supabase client's `getUser()`.

Titled "Your journal". Under the stats, a "Year in tea" row links each year with 3 or more tastings to `year/<year>`. Below the stats, `YourTaste` shows the taster's profile. Its `loading.tsx` skeleton is announced as a busy `status`.

The page heading uses the same `text-3xl sm:text-4xl` size as the other pages, and the empty panel is shorter on phones.

The timeline also lists café drink tastings, each with Edit and Delete; the stats, year row and `YourTaste` profile are built from the teas only (`teaEntries`).

## Contents

- `loading.tsx`
- `page.tsx`
- `year/`

## Parent

[(public)](../README.md)
