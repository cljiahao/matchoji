# lib

## Purpose

`downscaleImage` shrinks a photo to 1600px on its long edge as JPEG before upload; `scanLabel` and `fetchScanEnabled` call the route and map failures to `LabelScanError` with plain-language `SCAN_ERROR_MESSAGES`; `pickMatch` scores catalogue candidates against a reading (word-set overlap of maker and name, same category only) and accepts one only at 0.7 or better.

## Contents

- `downscale-image.ts`
- `index.ts`
- `scan-label.ts`
- `score-match.test.ts`
- `score-match.ts`

## Connectivity

`score-match` is pure and used server-side by `api/match-label`; the rest runs in the browser.

## Parent

[label-scan](../README.md)
