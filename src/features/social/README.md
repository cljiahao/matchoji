# social

## Purpose

The Vivino-style social layer (M3 of the 2026-10-24 roadmap): public taster profiles, follows,
blocking, privacy and the feed of people you follow. Profiles are public by default; a private
one shows only its name, though its ratings still appear on tea pages. Blocking ends any follow
between two people and stops new ones (the database enforces both).

## Contents

- `api/`
- `components/`
- `index.ts`
- `types.ts`

## Connectivity

Depends on `products` and `reviews` (tea summaries, review rows); the profile page also uses
`taste` for the taster's profile. Used by `/u/[id]`, the home page feed and `/account`.

## Parent

[features](../README.md)
