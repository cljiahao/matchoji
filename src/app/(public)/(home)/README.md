# (home)

## Purpose

A route group with no URL segment: the home page and its skeleton. It exists so `loading.tsx` wraps only the home page. A `loading.tsx` higher up would stream every page below it with a 200 before it could redirect or call `notFound()`.

## Contents

- `loading.tsx`
- `page.test.tsx`
- `page.tsx`

## Parent

[(public)](../README.md)
