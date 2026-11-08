/**
 * Christ Attendance - High-Performance Service Worker
 * Version: v3-confessions-live
 * Enforces network-first caching so students ALWAYS see the latest updates.
 */

const CACHE_NAME = "cu-attendance-v3-confessions";
const SHELL_ASSETS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: Cache essential static icon assets and skip waiting immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
});

// Activate: Delete ALL older caches to ensure users get the newest build
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Pure Network-First for navigation and HTML pages to prevent stale cache
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Strictly network-only for API and Keycloak auth
  if (
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/attendance") ||
    url.pathname.includes("/marks") ||
    url.pathname.includes("/hostel") ||
    url.pathname.includes("/confessions") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // For HTML / Navigation requests: Always fetch from network first so updates are instant
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // For static assets: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
