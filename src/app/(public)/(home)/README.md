# (home)

## Purpose

A route group with no URL segment: the home page and its skeleton. It exists so `loading.tsx` wraps only the home page. A `loading.tsx` higher up would stream every page below it with a 200 before it could redirect or call `notFound()`.

The home page has its own `generateMetadata`: title, description and a canonical `/?city=<city>` for the resolved city (query, else cookie, else Singapore).

## Contents

- `loading.tsx`
- `page.test.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
