// Mindfull Food Fitness service worker.
//
// Strategy
// - Static, versioned assets (/_next/static, fonts, icons, images): stale-while-revalidate.
// - Page navigations: network first, branded offline page if the network is down.
//   HTML is NEVER cached, so signed-in pages (dashboard, coach, account) are never stored.
// - Everything else (API routes, auth, Supabase, anything cross-origin): untouched, straight to network.
const VERSION = "mff-v2";
const STATIC = `${VERSION}-static`;
const IMAGES = `${VERSION}-images`;
const OFFLINE_URL = "/offline.html";
const MAX_IMAGES = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll([OFFLINE_URL, "/icons/icon-192.png", "/brand/Logo_Outlined.png"])),
  );
  // A new worker waits until the page asks it to take over (see ServiceWorker.tsx),
  // so an update never swaps assets under someone mid-workout.
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

function staleWhileRevalidate(event, cacheName, max) {
  const req = event.request;
  event.respondWith(
    caches.open(cacheName).then(async (cache) => {
      const hit = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            cache.put(req, res.clone());
            if (max) event.waitUntil(trim(cacheName, max));
          }
          return res;
        })
        .catch(() => hit || Response.error());
      return hit || network;
    }),
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          return preload || (await fetch(req));
        } catch {
          const cache = await caches.open(STATIC);
          return (await cache.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  const p = url.pathname;
  if (p.startsWith("/api/") || p.startsWith("/auth/")) return;

  if (p.startsWith("/_next/static/") || p.startsWith("/fonts/") || p.startsWith("/icons/") || p.startsWith("/brand/")) {
    staleWhileRevalidate(event, STATIC);
    return;
  }
  if (p.startsWith("/_next/image") || /\.(?:png|jpe?g|webp|avif|svg|gif)$/i.test(p)) {
    staleWhileRevalidate(event, IMAGES, MAX_IMAGES);
  }
});
