// Service Worker for PWA
const CACHE_NAME = "jlowe-ai-v2";
const urlsToCache = ["/", "/about", "/projects", "/contact", "/articles"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache each URL individually to handle failures gracefully
      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch(() => {
            // Silently fail for individual URLs that can't be cached
          })
        )
      );
    }),
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
