# label-scan

## Purpose

Scan a tea tin or packet instead of typing it. A signed-in user photographs a label in the log-a-tasting dialog; the photo is downscaled to 1600px in the browser, sent to `/api/label-scan`, read by Claude (`claude-haiku-5-5`, structured output validated with Zod, Japanese labels transliterated to English, null rather than a guess) and matched against the catalogue. A confident match preselects that tea; otherwise the add-a-tea form opens pre-filled. The person always confirms; nothing is submitted for them. The feature ships dark: the button renders only once the server reports `ANTHROPIC_API_KEY` is set (set it in Vercel's environment to turn it on). Photos are not stored.

## Contents

- `api/`
- `components/`
- `hooks/`
- `index.ts`
- `lib/`
- `schemas/`
- `server.ts`

## Connectivity

Depends on `products` (catalogue search) and `auth` (session) through their `index.ts`. `reviews` uses `ScanLabelButton` through this module's `index.ts`. `server.ts` is the server-only entry for the route handler; `index.ts` carries client code.

## Parent

[features](../README.md)
