const CACHE_NAME = 'medusa-mesa-cache-v2';
const OFFLINE_URL = './offline.html';

const urlsToCache = [
  './',
  './index.html',
  './offline.html',  // Nova página offline
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './css/styles.css',
  './js/app.js',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())  // Ativa imediatamente
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assume controle imediato
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  // Ignora requisições não-GET e chrome-extension
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Sempre busca na rede para atualizar cache
        const networkFetch = fetch(event.request)
          .then(response => {
            // Atualiza cache com nova versão
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Fallback inteligente baseado no tipo
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            if (event.request.destination === 'image') {
              return caches.match('./images/offline-image.png');
            }
            
            return cachedResponse || new Response('Offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });

        // Retorna cache imediatamente se existir, mas atualiza em background
        return cachedResponse || networkFetch;
      })
  );
});

// Notificações Push (opcional)
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: './' }
  };
  
  event.waitUntil(
    self.registration.showNotification('Medusa App', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
