const CACHE_NAME = 'ysg-sales-v2';
const ASSETS = [
    '/',
    '/manifest.json',
    '/logo.jpg',
    '/pwa-icon.jpg',
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('SW: Clearing old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Claim clients immediately so the new SW takes control
    );
});

self.addEventListener('fetch', (event) => {
    // Only intercept local HTTP/HTTPS requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Network-First Strategy: try to fetch from network first, fall back to cache if offline
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If we get a valid response, clone and cache it
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache if network request fails (offline)
                return caches.match(event.request);
            })
    );
});
