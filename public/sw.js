const CACHE_NAME = 'serenity-v5';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
];

// Precache essential application shell on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error:', err);
      });
    })
  );
});

// Purge legacy caches on activate and immediately take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Allow client pages to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Strategy:
// 1. Navigation requests: Network-First with fast 2.5s timeout falling back to cached /index.html.
//    Never serves stale HTML with dead Vite chunk hashes while online, and never resolves to undefined.
// 2. Static Vite assets (/assets/*, fonts, images): Cache-First with runtime caching.
//    Returns valid 404 response on failure instead of undefined to prevent ERR_FAILED.
// 3. Other requests: Network-First with Cache fallback.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation requests (HTML App Shell):
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const networkResponse = await fetch(request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/index.html', networkResponse.clone());
            return networkResponse;
          }
        } catch (err) {
          // Network failed or timed out; fall through to cache
        }

        // Cache fallback: return cached index.html
        const cachedHtml = await caches.match('/index.html');
        if (cachedHtml) {
          return cachedHtml;
        }

        // Secondary fallback to matching request URL directly
        const matched = await caches.match(request);
        if (matched) {
          return matched;
        }

        // Fallback offline HTML response (never resolve event.respondWith to undefined)
        return new Response(
          '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Serenity Breathing — Offline</title><style>body{font-family:system-ui,-apple-system,sans-serif;padding:3rem 1.5rem;text-align:center;color:#1e3a2f;background:#f4f7f5}h1{font-size:1.5rem;margin-bottom:1rem}p{color:#4a675a;margin-bottom:1.5rem}button{background:#245c42;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer}</style></head><body><h1>🌿 Serenity Breathing</h1><p>You appear to be offline or the connection timed out.</p><button onclick="window.location.reload()">Reload Application</button></body></html>',
          {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          }
        );
      })()
    );
    return;
  }

  // 2. Static Assets: Bundles, Styles, Fonts, Images
  const isViteAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
     /\.(js|css|woff2|woff|ttf|png|svg|jpg|jpeg|webp|ico)$/i.test(url.pathname));

  const isExternalFont =
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isViteAsset || isExternalFont) {
    event.respondWith(
      (async () => {
        // Cache-First: return immediately if available
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network and cache
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Never resolve to undefined: return a clean 404 response
          return new Response(null, { status: 404, statusText: 'Not Found' });
        }
      })()
    );
    return;
  }

  // 3. Fallback for all other GET requests: Network-First with cache fallback
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response(null, { status: 504, statusText: 'Gateway Timeout' });
      }
    })()
  );
});
