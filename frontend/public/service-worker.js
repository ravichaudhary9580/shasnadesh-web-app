/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'shasnadesh-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  '/robots.txt'
];

// Check if we're in development mode
const isDevelopment = self.location.hostname.includes('localhost') || 
                      self.location.hostname.includes('127.0.0.1');

// Install event - cache essential files
self.addEventListener('install', (event) => {
  // Skip caching in development
  if (isDevelopment) {
    console.log('Skipping cache in development');
    return self.skipWaiting();
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network-first strategy for development, cache-first for production
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (event.request.url.includes('chrome-extension')) return;
  
  // Skip webpack dev server requests in development
  if (event.request.url.includes('localhost') || event.request.url.includes('127.0.0.1')) {
    return;
  }
  
  // For API requests, always go to network
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // For development, always fetch from network
        const networkFetch = fetch(event.request)
          .then((response) => {
            // Don't cache in development
            if (!event.request.url.includes('localhost') && !event.request.url.includes('127.0.0.1')) {
              // Check if we received a valid response
              if (response && response.status === 200 && response.type === 'basic') {
                // Clone the response
                const responseToCache = response.clone();
                
                // Cache the new response
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
            }
            return response;
          })
          .catch(() => {
            // If network fails and we have a cached response, use it
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If both cache and network fail, return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // For other requests, return error
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' },
            });
          });
        
        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || networkFetch;
      })
  );
});
