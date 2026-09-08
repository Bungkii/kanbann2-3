/**
 * Service Worker for พริมทวงยิก ม.2/3
 * Strategy: Cache-first for static assets, Network-first for pages/API
 */

const CACHE_NAME = 'primja-v1';
const OFFLINE_URL = '/offline';

// Static assets to pre-cache (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/kanban',
  '/schedule',
  '/login',
  '/offline',
  '/icons/icon-192.jpg',
  '/icons/icon-512.jpg',
  '/asset/student-boy.webp',
  '/asset/student-girl.webp',
];

// ─────────────────────────────────────────
// Install: pre-cache app shell
// ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache best-effort (don't fail install if some URLs are unavailable)
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            console.warn('[SW] Failed to pre-cache:', url);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ─────────────────────────────────────────
// Activate: clean old caches
// ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─────────────────────────────────────────
// Fetch: routing strategy
// ─────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // Skip Next.js internals and Supabase
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) return;

  // Static assets → Cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/asset/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.match(/\.(webp|jpg|jpeg|png|svg|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // Pages → Network-first with offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached || caches.match(OFFLINE_URL)
        )
      )
  );
});
