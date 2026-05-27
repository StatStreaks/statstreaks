// StatStreaks Service Worker
// Strategy: cache-first for static assets, network-first for Supabase/API calls

const CACHE_NAME = 'statstreaks-v1';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// Origins that should always go straight to network (Supabase, Google Ads, Analytics)
const NETWORK_ONLY_ORIGINS = [
  'lqxcrzpqsdqonvrifpei.supabase.co',
  'googlesyndication.com',
  'googletagmanager.com',
  'google-analytics.com',
  'googleadservices.com',
  'pagead2.googlesyndication.com',
];

// ── INSTALL — pre-cache app shell ─────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ── ACTIVATE — clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ── FETCH — routing logic ──────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Always network-only for Supabase and ad/analytics requests
  if (NETWORK_ONLY_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Network-only for non-GET requests
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. Network-only for browser extensions
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 4. For navigation requests (HTML pages) — network-first, fall back to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          // Offline — serve cached index.html so the SPA still loads
          caches.match('/index.html')
        )
    );
    return;
  }

  // 5. For static assets (JS, CSS, fonts, images) — cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache for next time
      return fetch(event.request).then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline and not cached — nothing we can do for this asset
        return new Response('', { status: 408, statusText: 'Offline' });
      });
    })
  );
});