const CACHE_NAME = 'serenity-v4';
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
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Purge legacy caches on activate and immediately take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy:
// 1. Navigation requests: Stale-While-Revalidate (instant <50ms PWA cold start from cache, background refresh)
// 2. Static Vite assets (/assets/*, .js, .css, .woff2, fonts): Cache-First with automatic runtime caching
// 3. Other requests: Network-First with Cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation (HTML App Shell): Return cached index.html immediately for instant startup
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cachedHtml) => {
        // Trigger background revalidation to keep cache fresh
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
            }
            return networkResponse;
          })
          .catch(() => cachedHtml);

        // Return cached shell immediately if available; else wait for network
        return cachedHtml || networkFetch;
      })
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
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => {
          return cachedResponse;
        });
      })
    );
    return;
  }

  // 3. Fallback for all other GET requests: Network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
