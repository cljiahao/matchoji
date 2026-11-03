# components

## Purpose

`ScanLabelButton`: a 44px outline button with a camera icon that opens the phone's rear camera (`capture="environment"`), shows "Reading label…" while scanning, and reports unreadable, rate-limited and offline failures as toasts. Renders nothing while the server has scanning switched off or the viewer is signed out.

## Contents

- `index.ts`
- `scan-label-button.test.tsx`
- `scan-label-button.tsx`

## Connectivity

Uses `hooks/` for the enabled flag and the scan mutation; `reviews`' `LogTastingDialog` hosts it.

## Parent

[label-scan](../README.md)
