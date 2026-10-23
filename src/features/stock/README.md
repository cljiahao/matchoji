# stock

## Purpose

Community stock reports. Signed-in tea drinkers say whether a tea was in stock or sold out
when they checked its maker's shop; the product page shows the latest report and its age
next to a link to that shop. Matchoji does not check shops itself: Marukyu Koyamaen's
robots.txt disallows all crawling and Ippodo's terms forbid scraping, so the design spec's
retailer stock scrape was replaced by this.

## Contents

- `api/`
- `components/`
- `hooks/`
- `index.ts`
- `lib/`
- `types.ts`

## Connectivity

Depends on `auth` (session and the sign-in prompt) through its `index.ts`. The product page
passes in the tea's id, brand and `shopUrl` from `products`, so this module does not import
`products`.

## Parent

[features](../README.md)
