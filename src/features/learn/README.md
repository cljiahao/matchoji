# learn

## Purpose

The Learn tab's content: courses (Matcha 101 and Hojicha at home, short lessons ending in a
recipe to make and log, with each learner's progress saved), recipes (dose, water, temperature,
milk, steps, tips) and guides (grades, tools, storage, scarcity). Content is typed data in the repo rather than a CMS, so it
is reviewed like code and every recipe's numbers are checked against what a tasting accepts.
A recipe's "Log a tasting with this recipe" button opens the usual tasting dialog with its
prep method, dose, water and temperature already filled in.

## Contents

- `api/`
- `components/`
- `content/`
- `hooks/`
- `index.ts`
- `lib/`
- `types.ts`

## Connectivity

Depends on `products` (category styles, `discoverHref`), `reviews` (`PREP_METHODS`,
`PrepPreset`, `LogTastingDialog`) and `auth` (session and sign-in prompt, for course progress)
through their `index.ts`. Progress is stored in `lesson_progress` by course and lesson slug. The pages live in
`src/app/(public)/learn/`, and `src/app/sitemap.ts` lists every recipe and guide.

## Parent

[features](../README.md)
