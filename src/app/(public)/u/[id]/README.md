# [id]

## Purpose

A taster's profile: name, when they joined, teas rated, followers and following, Follow and
Block, their taste and recent tastings. A private profile shows only the name; an unknown or
malformed id 404s. Public (or own) profiles show a short stats strip: teas rated, matcha and hojicha counts and, from 3 teas, a top region; a private profile's tastings are not read at all for other viewers. Titled with the taster's name through `share`'s `profileMetadata`; private profiles are kept out of search
engines and share no counts. `opengraph-image.tsx` draws the name and teas rated for a public profile and the site card for a private or unknown one.

Recent tastings may include café drink reviews; the taste profile is built from the tea tastings only.

## Contents

- `opengraph-image.tsx`
- `page.tsx`
- `year/`

## Parent

[u](../README.md)
