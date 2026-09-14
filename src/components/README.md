# components

## Purpose

UI components, layered from generated primitives up to app shell.

## Contents

- `layout/`
- `ui/`
- `widgets/`

## Connectivity

`ui/` is CLI-managed shadcn/ui primitives (do not hand-edit). `widgets/` composes those primitives into project-owned reusable pieces (cards, dialogs, form fields). `layout/` composes `widgets/` and `ui/` into the app shell (navbar, footer, providers) that `src/app/` layouts render.

## Parent

[src](../README.md)
