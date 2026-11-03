# hooks

## Purpose

`useLabelScanEnabled` asks `GET /api/label-scan` once per session whether scanning is on; `useScanLabel` is the mutation that uploads a photo.

## Contents

- `index.ts`
- `use-label-scan.ts`

## Connectivity

Wraps `lib/scan-label` in TanStack Query.

## Parent

[label-scan](../README.md)
