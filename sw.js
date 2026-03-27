const CACHE_NAME = 'tacam-reservas-v4';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './delivery-core.js',
  './register-sw.js',
  './manifest.webmanifest',
  './assets/logo-color.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isCriticalAsset = request.mode === 'navigate' || ['script', 'style', 'document'].includes(request.destination);

  if (isSameOrigin && isCriticalAsset) {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error('Network unavailable and cache miss');
      }
    })());
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
