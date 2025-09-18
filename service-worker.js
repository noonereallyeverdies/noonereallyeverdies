const CACHE_NAME = 'finance-buddy-cache-v1';
const SCOPE = self.registration.scope;
const BASE_PATH = new URL('.', SCOPE).pathname;
const OFFLINE_URL = `${BASE_PATH}offline.html`;
const ASSETS = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.webmanifest',
  'offline.html',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
].map((asset) => `${BASE_PATH}${asset}`);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {
      if (request.mode === 'navigate') {
        try {
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (error) {
          const cached = await caches.match(OFFLINE_URL);
          return cached || Response.error();
        }
      }

      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (error) {
        const fallback = await caches.match(OFFLINE_URL);
        return fallback || Response.error();
      }
    })()
  );
});
