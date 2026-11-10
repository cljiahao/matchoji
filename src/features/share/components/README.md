# components

## Purpose

The share-image layouts, drawn with inline styles and SVG because `next/og` renders no CSS classes. `SiteCard`, `TeaCard`, `ProfileCard` and `YearCard` (`share-cards.tsx`) are the 1200×630 cards; `YearCard` takes `YearCardData`, which holds counts and tea names only; `CafeCard` and `DrinkCard` are the café and drink cards. `ShareTin` is `TeaTin`'s drawing without the label art; `LogoMark` is `public/image_assets/logo.svg` redrawn.

`ProfileCard` takes an optional `taster` (bio and a pre-validated handle): a trusted taster's card reads "Trusted taster on Matchoji" with the bio (clipped to 140 characters) and `@handle`.

`DrinkCard` words the partnership line as "n of m taster reviews were invited, gifted or paid".

## Contents

- `logo-mark.tsx`
- `share-cards.tsx`
- `share-tin.tsx`

## Parent

[share](../README.md)
