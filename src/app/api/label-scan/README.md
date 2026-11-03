# label-scan

## Purpose

The `/api/label-scan` route. `POST` takes a multipart `image` (JPEG, PNG or WebP, up to 5 MB) from a signed-in user, counts it against their 20 scans a day, has Claude (`claude-haiku-5-5`) read the label, and answers `{ reading, match }` where `match` is a confident catalogue tea or null. The photo is never stored. Errors: 401 signed out, 503 no `ANTHROPIC_API_KEY`, 400 bad file, 429 daily limit, 422 nothing legible. `GET` says whether the key is set (`{ enabled }`), which is how the UI decides to show "Scan label". The API call is made server-side, so the content security policy needs no change.

## Contents

- `route.ts`

## Connectivity

Logic lives in `features/label-scan` (server entry `server.ts`); the limit is the `label_scans` table's trigger.

## Parent

[api](../README.md)
