const CACHE_NAME = 'tacam-delivery-v3';
const ASSETS = [
  './',
  './index.html',
  './usuarios-app.html',
  './repartidores-app.html',
  './recepcion-app.html',
  './delivery.css',
  './delivery-core.js',
  './usuarios-app.js',
  './repartidores-app.js',
  './recepcion-app.js',
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
