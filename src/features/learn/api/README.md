# api

## Purpose

`listCompletedLessons` (the signed-in learner's finished lessons in one course; row-level
security limits it to their own), `markLessonDone` (an "already done" duplicate counts as
success) and `unmarkLesson`, all on `lesson_progress`.

## Contents

- `index.ts`
- `progress-service.test.ts`
- `progress-service.ts`

## Parent

[learn](../README.md)
