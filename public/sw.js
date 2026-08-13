// Minimal offline cache so core play works without a network (offline-capable constraint).
// The on-device recognizer model (assets/models/) is cached on first use as well.
const CACHE = 'animal-sounds-v1';
const CORE = ['/', '/index.html', '/assets/animals.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// Cache-first for same-origin GETs; falls back to network and caches the response.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          // Persist only successful responses: a cached 404/error page would otherwise be
          // served forever by cache-first (e.g. in place of a recognizer model tarball).
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }),
    ),
  );
});
