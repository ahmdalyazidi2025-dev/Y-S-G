const CACHE_NAME = 'ysg-sales-v2'; // Incremented version to force update
const ASSETS = [
    '/',
    '/manifest.json',
    '/logo.png',
    '/app-icon-v2.png',
    '/offline.html', // Optional: You might want to create this
];

// Install: Cache core assets and force activation
self.addEventListener('install', (event) => {
    self.skipWaiting(); // IMPORTANT: Force new SW to take over immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch(err => {
                console.error('Failed to cache assets during install:', err);
            });
        })
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(), // Take control of all clients immediately
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            console.log('Deleting old cache:', key);
                            return caches.delete(key);
                        }
                    })
                );
            })
        ])
    );
});

// Fetch: Network First for HTML, Stale-While-Revalidate for assets
self.addEventListener('fetch', (event) => {
    // const url = new URL(event.request.url); // Unused

    // 1. Navigation (HTML) -> Network First
    // This ensures the user ALWAYS gets the latest version if online.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request)
                        .then((response) => {
                            if (response) return response;
                            // Optional: Return custom offline page
                            return caches.match('/');
                        });
                })
        );
        return;
    }

    // 2. Static Assets (Images, JS, CSS) -> Stale-While-Revalidate
    // Serve from cache fast, but update in background for next time
    if (event.request.destination === 'style' ||
        event.request.destination === 'script' ||
        event.request.destination === 'image') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // 3. API calls or others -> Network Only (don't cache API data aggressively in SW)
    // We handle data caching in React Query or Context if needed.
    // Default fallback
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
