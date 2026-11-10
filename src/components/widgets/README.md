# widgets

## Purpose

Reusable components composed from `src/components/ui/` primitives, project-owned (not CLI-managed).
`CustomFormField` binds any control (inputs, the review form's selects and star input) to
react-hook-form with one label style, `htmlFor`, and inline errors. `UnitInput` is a 44px-tall text or number input with its unit (S$, g, ml, °C) shown inside the field. `LinkList` renders the
footer's section links. `BackLink` is the one back link (chevron, "Back to <label>" for
screen readers, 44px hit area, focus ring), named by where it goes.

`tea-map/` is the Leaflet map (OpenStreetMap tiles, imported client-side inside an effect, so the server renders only its labelled `role="region"` container): pins carry names, region pins link on, shop pins open a popup with Directions; controls use tokens at 44px, and dark mode dims the tiles with a CSS filter.

`log-dialog/` is `LogDialog`, the chooser between logging a café drink and a tea; like `TeaMap` it is imported from its own folder, not `index.ts`.

`TeaMap` is not re-exported from `index.ts`: its Leaflet stylesheet would then load on every page that uses `BackLink` or `UnitInput`. Import it from `@/components/widgets/tea-map`.

## Contents

- `back-link.test.tsx`
- `back-link.tsx`
- `custom-form-field.tsx`
- `index.ts`
- `link-list.tsx`
- `log-dialog/`
- `tea-map/`
- `unit-input.test.tsx`
- `unit-input.tsx`

## Parent

[components](../README.md)
