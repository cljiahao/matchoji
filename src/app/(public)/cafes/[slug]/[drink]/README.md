# [drink]

## Purpose

One drink: café link, base, style, serving and price, then the taster score and community score side by side, "Tea used here" linking to the tea page when set, the trusted-taster reviews, then the community reviews, then similar drinks in the same city. With no reviews it says so. The drink's photo shows under the title with its credit and the alt text "drink at café" (a plain `<img>`, since remote image hosts are not configured for `next/image`). A merged drink redirects to its final survivor and a rejected drink to its café, permanently, and a merge loop is `notFound()`; an unknown or malformed slug is `notFound()`. Taster reviews never mix into the community list.

## Contents

- `loading.tsx`
- `opengraph-image.tsx`
- `page.test.tsx`
- `page.tsx`

## Parent

[[slug]](../README.md)
