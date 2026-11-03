// next.config.ts sets the build id per deploy; the worker reads it back from its own URL to name
// its cache, so a new deploy installs a fresh worker and the old caches are deleted.
export const SERVICE_WORKER_URL = `/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev'}`;
