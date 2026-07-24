// Moje Stavba — jednoduchy service worker
// Cachuje navstivene stranky, aby appka fungovala i bez pripojeni,
// a aby ji slo nainstalovat na plochu (vyzaduje ho vetsina prohlizecu).
const CACHE_NAME = 'moje-stavba-v3-flat';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const fresh = await fetch(event.request);
        cache.put(event.request, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await cache.match(event.request);
        return cached || Promise.reject(err);
      }
    })
  );
});
