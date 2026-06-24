/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// Injected at build time — includes /, hashed JS/CSS/favicon/manifest, and all icon URLs.
// In dev this constant is not defined, so we fall back to just caching on fetch.
declare const __PRECACHE_URLS__: string[] | undefined;

const CACHE = "dotaspy-v1";
const PRECACHE = typeof __PRECACHE_URLS__ !== "undefined" ? __PRECACHE_URLS__ : [];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      if (cached) return cached;
      try {
        const response = await fetch(e.request);
        if (response.ok) cache.put(e.request, response.clone());
        return response;
      } catch {
        return new Response(null, { status: 503 });
      }
    })
  );
});
