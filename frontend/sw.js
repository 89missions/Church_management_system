const CACHE_NAME = 'winners-chapel-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/signin.html',
    '/dashboard-secretary.html',
    '/dashboard-member.html',
    '/dashboard-leadership.html',
    '/dashboard-usher.html',
    '/add-member.html',
    '/edit-member.html',
    '/members-list.html',
    '/offerings.html',
    '/events.html',
    '/css/style.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/config.js',
    '/js/secretary-dashboard.js',
    '/js/member-dashboard.js',
    '/js/leadership-dashboard.js',
    '/js/usher-dashboard.js',
    '/js/offerings.js',
    '/js/events.js',
    '/js/members-list.js',
    '/js/add-member.js',
    '/js/edit-member.js',
    '/manifest.json'
];

// Install service worker - cache static assets only
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch with network-first strategy for API, cache-first for static
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // Skip API requests - never cache them
    if (url.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    // For static assets, try cache first, then network
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Activate and clean old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Receive and display push notifications
self.addEventListener('push', function(event) {
    let data = {};
    
    try {
        data = event.data.json();
    } catch (error) {
        data = {
            title: 'Winners Chapel',
            body: 'You have a new update'
        };
    }
    
    const options = {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Winners Chapel', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.openWindow(urlToOpen)
    );
});