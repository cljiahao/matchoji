# components

## Purpose

`RegisterServiceWorker` registers the service worker in production, quietly doing nothing where
workers are unsupported or registration fails. `OfflineScreen` is the on-brand "You're offline"
page ("cafés, teas and tastings" need a connection), with a retry button that reloads.

## Contents

- `index.ts`
- `offline-screen.tsx`
- `offline.test.tsx`
- `register-service-worker.tsx`

## Parent

[offline](../README.md)
