# content

## Purpose

`COURSES` (each lesson has sections and, optionally, a practice recipe), `RECIPES` and `GUIDES`,
with `findCourse` / `findLesson` (with the lesson's place in its course) / `findRecipe` /
`findGuide` by slug. Recipe doses and
temperatures are common starting points (usucha 2 g / 70 ml / 80°C, koicha 4 g / 30 ml,
lattes with 150 ml milk, steeped hojicha 5 g / 300 ml / 95°C) and each recipe says how to
adjust. `content.test.ts` checks slugs are unique, prep methods are ones a tasting can log,
numbers fit the tasting form's limits, guide links stay within the site, course and lesson slugs fit
the progress table, and practice recipes exist.

## Contents

- `content.test.ts`
- `courses.ts`
- `guides.ts`
- `index.ts`
- `recipes.ts`

## Parent

[learn](../README.md)
