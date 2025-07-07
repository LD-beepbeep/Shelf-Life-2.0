const CACHE_NAME = 'shelf-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',      // if you have an external CSS
  '/script.js',       // if you split your JS into files, adjust accordingly
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache first, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
