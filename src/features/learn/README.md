# learn

## Purpose

The Learn tab's content: recipes (dose, water, temperature, milk, steps, tips) and guides
(grades, tools, storage, scarcity). Content is typed data in the repo rather than a CMS, so it
is reviewed like code and every recipe's numbers are checked against what a tasting accepts.
A recipe's "Log a tasting with this recipe" button opens the usual tasting dialog with its
prep method, dose, water and temperature already filled in.

## Contents

- `components/`
- `content/`
- `index.ts`
- `lib/`
- `types.ts`

## Connectivity

Depends on `products` (category styles, `discoverHref`) and `reviews` (`PREP_METHODS`,
`PrepPreset`, `LogTastingDialog`) through their `index.ts`. The pages live in
`src/app/(public)/learn/`, and `src/app/sitemap.ts` lists every recipe and guide.

## Parent

[features](../README.md)
