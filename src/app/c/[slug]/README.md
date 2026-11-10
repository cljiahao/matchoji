# [slug]

## Purpose

`GET /c/<slug>` answers 308 with a `Location` of `/cafes/<slug>`. It never reads the database: the café page itself forwards a merged café, so an old short link still lands. A slug that could not be a café (not lowercase words joined by hyphens) is a 404 and never reaches the redirect.

## Contents

- `route.test.ts`
- `route.ts`

## Parent

[c](../README.md)
