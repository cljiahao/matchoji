# learn

## Purpose

The Learn tab. `/learn` lists the courses, every recipe as a card and every guide as a row;
`courses/[course]` shows a course's outline with the learner's progress and `courses/[course]/[lesson]`
one lesson with its practice recipe, "Mark lesson as done" and previous/next links;
`recipes/[slug]` shows a recipe's brew numbers, ingredients, tools, steps and tips with a
"Log a tasting with this recipe" button and a link to the top-rated teas of its category;
`guides/[slug]` shows a guide's sections and related links. All three are static (built from
`features/learn` content, one page per slug), and unknown slugs are 404s with noindex metadata.

## Contents

- `courses/`
- `guides/`
- `page.tsx`
- `recipes/`

## Parent

[(public)](../README.md)
