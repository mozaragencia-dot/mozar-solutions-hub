const CACHE_NAME = 'tacam-single-app-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './delivery-core.js',
  './register-sw.js',
  './manifest.webmanifest',
  './assets/logo-color.svg',
  './assets/logo-white.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
