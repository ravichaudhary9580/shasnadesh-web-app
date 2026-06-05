/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'shasnadesh-v5'; // ← bumped version to force fresh install
const OFFLINE_URL = '/offline.html';
const BASE_URL = 'https://www.shasnadeshupdates.com';

const STATIC_ASSETS = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/manifest.json`,
  `${BASE_URL}/favicon.ico`,
  `${BASE_URL}/offline.html`,
  `${BASE_URL}/logo192.png`,
  `${BASE_URL}/logo512.png`,
  `${BASE_URL}/robots.txt`,
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // ✅ FIX: Ignore cross-origin requests that aren't whitelisted
  const url = new URL(event.request.url);
  const isOwnOrigin = url.origin === self.location.origin;
  const isGoogleFont =
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
  const isS3 = url.hostname.includes('amazonaws.com');

  // ── 1. API requests → network only ────────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: 'You are offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    );
    return;
  }

  // ── 2. Google Fonts → cache-first ─────────────────────────────────────────
  if (isGoogleFont) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request).then((response) => {
              cache.put(event.request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // ── 3. S3 images → cache-first ────────────────────────────────────────────
  if (isS3) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request).then((response) => {
              if (response.ok) cache.put(event.request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // ✅ FIX: Skip unknown cross-origin requests entirely
  if (!isOwnOrigin) return;

  // ── 4. Navigation → network-first, fallback to offline page ───────────────
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // ── 5. Static assets → network-first, fallback cache ─────────────────────
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(
        () =>
          caches.match(event.request) ||
          new Response('Asset not available offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
      )
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'नया ब्लॉग पोस्ट';
  const options = {
    body: data.body || 'नया ब्लॉग उपलब्ध है',
    icon: '/logo192.png',
    badge: '/logo192.png',
    image: data.image,
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    tag: 'blog-notification',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'पढ़ें', icon: '/logo192.png' },
      { action: 'close', title: 'बंद करें' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const url = event.notification.data.url || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});