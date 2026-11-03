// Matchoji's service worker. It exists only so the installed app has something to show offline:
// hashed build files and icons are cached, pages are never cached (they differ per signed-in
// user), and when a page request fails the precached /offline page is shown instead.
// The page registers it as /sw.js?v=<build id>, so every deploy is a new worker with a new cache.
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = `matchoji-shell-${VERSION}`;
const OFFLINE_URL = '/offline';

// Same-origin GETs only. Everything else (API, auth, Sentry tunnel, other sites) goes straight
// to the network untouched.
function routeFor(request, origin) {
  if (request.method !== 'GET') return 'network';
  const url = new URL(request.url);
  if (url.origin !== origin) return 'network';
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    return 'cache-first';
  }
  if (request.mode !== 'navigate') return 'network';
  if (/^\/(api|auth|monitoring)(\/|$)/.test(url.pathname)) return 'network';
  return 'navigate';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const response = await fetch(OFFLINE_URL, { credentials: 'omit' });
      if (!response.ok) throw new Error(`offline page answered ${response.status}`);
      const cache = await caches.open(CACHE);
      await cache.put(OFFLINE_URL, response);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const route = routeFor(event.request, self.location.origin);
  if (route === 'cache-first') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(event.request);
        if (hit) return hit;
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      })()
    );
  } else if (route === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      })
    );
  }
});
