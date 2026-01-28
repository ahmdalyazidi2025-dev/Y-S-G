importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCS9sl7j-uIrxB_w6MwkRsN7fFDnGhZxE0",
    authDomain: "y-s-g-7c463.firebaseapp.com",
    projectId: "y-s-g-7c463",
    storageBucket: "y-s-g-7c463.firebasestorage.app",
    messagingSenderId: "163311897960",
    appId: "1:163311897960:web:cb8132ef61620e42fedadd",
    measurementId: "G-Y3JE7SCNGM"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'تنبيه جديد';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: payload.data?.icon || '/app-icon-v2.png',
        badge: '/app-icon-v2.png',
        tag: 'ysg-notification',
        renotify: true,
        data: {
            link: payload.fcmOptions?.link || payload.data?.link || '/'
        },
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'عرض التفاصيل' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions)
        .catch(err => console.error('Error showing notification:', err));
});

// Handle Notification Click
self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event);
    event.notification.close();

    const link = (event.notification.data && event.notification.data.link) || '/';

    // Open the link in a new tab or focus existing one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(link) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(link);
            }
        })
    );
});
