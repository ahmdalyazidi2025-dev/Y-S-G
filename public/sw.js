// 1. Import Firebase Scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// 2. Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCS9sl7j-uIrxB_w6MwkRsN7fFDnGhZxE0",
    authDomain: "y-s-g-7c463.firebaseapp.com",
    projectId: "y-s-g-7c463",
    storageBucket: "y-s-g-7c463.firebasestorage.app",
    messagingSenderId: "163311897960",
    appId: "1:163311897960:web:cb8132ef61620e42fedadd",
    measurementId: "G-Y3JE7SCNGM"
};

// Initialize Firebase and Messaging
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 3. Handle Background Messaging
messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'تنبيه جديد';
    const notificationOptions = {
        body: payload.data?.body || '',
        icon: payload.data?.icon || '/app-icon-v2.png',
        badge: '/app-icon-v2.png',
        tag: 'ysg-notification',
        renotify: true,
        vibrate: [100, 50, 100, 50, 200], // Standard rhythmic pattern
        data: {
            link: payload.data?.link || '/'
        },
        requireInteraction: true,
        silent: false,
    };

    console.log('[sw.js] Displaying notification:', notificationTitle, notificationOptions);

    // Note: Audio feedback is limited in background SW. 
    // Usually handled by system if sound is specified in FCM, but data-only gives us more UI control.

    return self.registration.showNotification(notificationTitle, notificationOptions)
        .catch(err => console.error('Error showing notification:', err));
});

// Handle Notification Click
self.addEventListener('notificationclick', function (event) {
    console.log('[sw.js] Notification click Received.', event);
    event.notification.close();

    const link = (event.notification.data && event.notification.data.link) || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(link) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(link);
            }
        })
    );
});

// --- Existing PWA logic below ---
const CACHE_NAME = 'ysg-sales-v8'; // Forced update for notification fix
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
