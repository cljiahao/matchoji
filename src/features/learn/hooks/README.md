# hooks

## Purpose

`useCourseProgress(courseSlug)`: one TanStack Query cache entry per course with the finished
lesson slugs, and `toggle(lessonSlug)`, which updates optimistically, rolls back with a toast if
saving fails, and asks a signed-out visitor to sign in.

## Contents

- `index.ts`
- `use-course-progress.ts`

## Parent

[learn](../README.md)
