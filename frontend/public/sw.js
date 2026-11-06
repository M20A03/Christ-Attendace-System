/**
 * Christ Attendance Viewer - Service Worker
 * Caches application shell assets for instant launch without caching dynamic API data.
 */

const CACHE_NAME = "cu-attendance-shell-v1";
const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: cache application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up older cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for dynamic navigation & API, Cache-first fallback for static shell assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Strictly NEVER cache API calls or auth requests (dynamic on-demand only)
  if (
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/attendance") ||
    url.pathname.includes("/marks") ||
    url.pathname.startsWith("/api/")
  ) {
    return; // Pass through to live network
  }

  // Shell assets caching strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached shell asset and fetch fresh version in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
