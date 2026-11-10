# components

## Purpose

`TeaHighlights` is a wrapping row of pills, one per computed claim. `SimilarTeas` is the tea
page's shelf (it reuses `ProductShelf`, "See all" going to Explore for the category). `TopListRows`
numbers a list's `ProductRow`s, badging "Great value" where earned, and `TopListCard` is an index
card for one tea list (linking `/top/teas/<slug>`). Each renders nothing when it has no data.

## Contents

- `discovery-components.test.tsx`
- `index.ts`
- `similar-teas.tsx`
- `tea-highlights.tsx`
- `top-list-rows.tsx`

## Parent

[discovery](../README.md)
