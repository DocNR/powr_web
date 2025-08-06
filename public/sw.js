const CACHE_NAME = 'powr-workout-pwa-v7';
const AVATAR_CACHE_NAME = 'powr-avatars-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/browserconfig.xml',
  '/icon-48.png',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-144.png',
  '/icon-192.png',
  '/icon-256.png',
  '/icon-512.png',
  '/apple-touch-icon-152x152.png',
  '/apple-touch-icon-167x167.png',
  '/apple-touch-icon-180x180.png',
  '/apple-touch-icon.png'
];


// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline with avatar caching
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Special handling for avatar images (common image hosts)
  const isAvatarImage = event.request.destination === 'image' && (
    url.hostname.includes('nostr.build') ||
    url.hostname.includes('void.cat') ||
    url.hostname.includes('i.imgur.com') ||
    url.hostname.includes('image.nostr.build') ||
    url.hostname.includes('primal.net') ||
    url.pathname.includes('avatar') ||
    url.pathname.includes('profile')
  );

  if (isAvatarImage) {
    event.respondWith(
      caches.open(AVATAR_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('Serving avatar from cache:', url.href);
            return cachedResponse;
          }
          
          // Fetch and cache avatar images
          return fetch(event.request).then(response => {
            if (response.ok) {
              console.log('Caching avatar image:', url.href);
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => {
            // Return a fallback or empty response if fetch fails
            console.log('Avatar fetch failed, using fallback');
            return new Response('', { status: 404 });
          });
        });
      })
    );
  } else {
    // Regular caching for other resources
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request);
        }
      )
    );
  }
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
    })
  );
});

// Handle background sync for offline workout data
self.addEventListener('sync', (event) => {
  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkoutData());
  }
});

async function syncWorkoutData() {
  // This would sync any offline workout data when connection is restored
  console.log('Syncing workout data...');
  // Implementation would depend on your data storage strategy
}

// Handle push notifications (if needed)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New workout reminder!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Start Workout',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('POWR Workout', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app to the active workout tab
    event.waitUntil(
      clients.openWindow('/?tab=active')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
