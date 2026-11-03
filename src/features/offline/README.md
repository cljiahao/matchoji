# offline

## Purpose

The installed app's offline shell. `public/sw.js` is a hand-written service worker (no library:
it is about 60 lines): it precaches `/offline`, serves `/_next/static/*` and `/icons/*`
cache-first, and answers a failed page navigation with `/offline`. It never caches HTML, API
routes, `/auth/*` or `/monitoring`, so no signed-in user's page can reach another user. It is
registered as `/sw.js?v=<build id>` (`next.config.ts` sets the id from the commit), so each deploy
installs a new worker whose new cache replaces the old ones. `RegisterServiceWorker` registers it
in production only; `OfflineScreen` is the page it shows.

## Contents

- `components/`
- `constants.ts`
- `index.ts`
- `service-worker.test.ts`

## Connectivity

Depends on nothing but `components/ui`. The root layout registers the worker and `app/offline`
renders the screen.

## Parent

[features](../README.md)
