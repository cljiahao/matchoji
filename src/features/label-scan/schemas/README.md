# schemas

## Purpose

Zod schemas at each boundary: `labelImageSchema` (type and 5 MB limit of the upload), `labelReadingSchema` (what the model returns, every field nullable except confidence) and `scanResponseSchema` (what the route returns, checked in the browser).

## Contents

- `index.ts`
- `label.schema.ts`

## Connectivity

Shared by the route, `api/` and `lib/`.

## Parent

[label-scan](../README.md)
